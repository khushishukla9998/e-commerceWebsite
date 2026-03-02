const User = require("../model/userModel");
const mongoose = require("mongoose");
const Address = require("../model/addressModel");
const bcrypt = require("bcryptjs");
const token = require("../../../middleware/index");
const ENUM = require("../../utils/enum");
const appStrings = require("../../utils/appString");
const commonUtils = require("../../utils/commonUtils");
const RewardHistory = require("../model/rewardHistoryModel");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const redisClient = require("../../utils/redisClient");
const sendVerificationEmail = require("../../utils/emailService");
const sendOtp = require("../../utils/smsService");
const config = require("../../../../config/dev.json");
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);
//====================REGISTER=======================================================\\

function normalizeIndianMobile(mobileNo) {
  if (!mobileNo) {
    throw new Error(appStrings.MOBILE_NUMBER_REQUIRED);
  }

  let str = mobileNo.toString().trim();

  // Strip all non-digits
  str = str.replace(/\D/g, "");

  // Handle common Indian prefixes
  if (str.length === 12 && str.startsWith("91")) {
    str = str.slice(2);
  } else if (str.length === 13 && str.startsWith("0")) {
    // Some might use 091...
    str = str.slice(3);
  } else if (str.length === 11 && str.startsWith("0")) {
    str = str.slice(1);
  }

  if (str.length !== 10) {
    throw new Error(
      appStrings.INVALID_MOBILE_FORMAT,
    );
  }

  return str;
}

const register = async function (req, res) {
  try {
    console.log("request body:", req.body);
    const { name, email, password, profileImage, mobileNo } = req.body;

    // if both provided
    if (email && mobileNo) {
      return commonUtils.sendErrorResponse(req, res, appStrings.NOT_BOTH);
    }

    // if none provided
    if (!email && !mobileNo) {
      return commonUtils.sendErrorResponse(req, res, appStrings.REQUIRED);
    }

    // Prepare query for existing user
    const query = { isDeleted: ENUM.DELETE_STATUS.NOT_DELETE };
    if (email) query.email = email;
    if (mobileNo) {
      let formattedMobile;
      try {
        formattedMobile = normalizeIndianMobile(mobileNo);
        query.mobileNo = formattedMobile;
      } catch (e) {
        return commonUtils.sendErrorResponse(req, res, e.message);
      }
    }

    // user exist or not
    const userExist = await User.findOne(query);

    if (userExist) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.USER_EXIST,
        null,
        409,
      );
    }

    // create customer id
    const customer = await stripe.customers.create({
      name: name,
      email: email,
      mobileNo: mobileNo

    });
    console.log(customer.id);

    // hash password
    const hashpass = await bcrypt.hash(password, 10);

    // prepare user data
    const userData = {
      name,
      password: hashpass,
      profileImage: profileImage || null,
      email: email || null,
      mobileNo: null,
      cust_id: customer.id,
      customer: customer
    };

    let otp;

    // ============ email registration ============== //
    let emailOtp;
    if (email) {
      emailOtp = Math.floor(100000 + Math.random() * 900000);
      userData.emailOtp = emailOtp;
      userData.emailOtpExpire = Date.now() + 5 * 60 * 1000; // 5 min
    }

    // send otp email (if email reg)
    if (email) {
      try {
        await sendVerificationEmail(email, emailOtp);
      } catch (e) {
        console.error("Error sending verification email:", e);
      }
    }

    // ============ phone registration ============== //

    let formattedMobileForSms;
    if (mobileNo) {
      let formattedMobile;
      try {
        formattedMobile = normalizeIndianMobile(mobileNo);
        userData.mobileNo = formattedMobile;
        // Full format for Twilio
        formattedMobileForSms = `+91${formattedMobile}`;
      } catch (e) {
        console.error("Mobile normalize error:", e.message);
        return commonUtils.sendErrorResponse(req, res, e.message);
      }

      //OTP generation
      otp = Math.floor(100000 + Math.random() * 900000);

      userData.otp = otp;
      userData.otpExpire = Date.now() + 5 * 60 * 1000; // 5 min
    }

    // create user exactly once
    const user = await User.create(userData);

    // send OTP (if phone reg)
    if (mobileNo && formattedMobileForSms) {
      try {
        console.log("Sending OTP to:", formattedMobileForSms, "otp:", otp);
        await sendOtp(formattedMobileForSms, otp);
      } catch (e) {
        console.error("Error sending OTP via Twilio:", e);
        return commonUtils.sendErrorResponse(
          req,
          res,
          appStrings.OTP_FAILED_CONTACT,
        );
      }
    }

    // generate tokens
    const accessToken = token.generateAccessToken({ id: user._id });
    const refreshToken = token.generateRefreshToken({ id: user._id });

    // store tokens in cookies
    commonUtils.storeAcessTokenInCookie(res, "accessToken", accessToken);
    commonUtils.storeRefreshTokenInCookie(res, "refreshToken", refreshToken);

    // store tokens in Redis
    await redisClient.set(`user:access:${user._id}`, accessToken, {
      EX: config.REDIS_ACCESS_TOKEN_EXPIRE,
    });
    await redisClient.set(`user:refresh:${user._id}`, refreshToken, {
      EX: config.REDIS_REFRESH_TOKEN_EXPIRE,
    });

    // send success response
    return commonUtils.sendSuccessResponse(
      req,
      res,
      appStrings.REGISTRATION_SUCCESS,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNo: user.mobileNo,
          profileImage: user.profileImage,
          status: user.status,
          emailOtp: user.emailOtp,
          otp: user.otp,
          cust_id: customer.id
        },
        accessToken,
        refreshToken,
      },
    );
  } catch (err) {
    console.log(appStrings.REGISTRATION_ERROR, err);
    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.REGISTRATION_FAILED,
    );
  }
};

//========================LOGIN=============================================================================//

// login user after registration

const login = async function (req, res) {
  try {
    const { email, mobileNo, password } = req.body;

    const query = { isDeleted: ENUM.DELETE_STATUS.NOT_DELETE };
    const orConditions = [];

    if (email) {
      orConditions.push({ email });
    }

    if (mobileNo) {
      try {
        const formattedMobile = normalizeIndianMobile(mobileNo);
        orConditions.push({ mobileNo: formattedMobile });
      } catch (e) {
        return commonUtils.sendErrorResponse(req, res, e.message);
      }
    }

    if (orConditions.length === 0) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.EMAIL_MOBILE_REQUIRED,
      );
    }

    query.$or = orConditions;

    // find user
    const user = await User.findOne(query);

    // if user not active or not register
    if (!user) {
      // Check if user was deleted by admin (fallback check)
      const deletedUser = await User.findOne({
        $or: [
          email ? { email } : null,
          mobileNo ? { mobileNo: normalizeIndianMobile(mobileNo) } : null,
        ].filter(Boolean),
        isDeleted: ENUM.DELETE_STATUS.ADMIN_DELETE,
      });

      if (deletedUser) {
        return commonUtils.sendErrorResponse(
          req,
          res,
          appStrings.USER_ADMIN_DELETED,
          null,
          403,
        );
      }
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.USER_NOT_FOUND,
        null,
      );
    }

    if (user.email && !user.isEmailVerfied) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.VERIFY_EMAIL_FIRST,
        null,
      );
    }

    if (user.mobileNo && !user.isMobileVerfied) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.VERIFY_MOBILE_FIRST,
        null,
      );
    }
    // compare the password which is enter by the user is correct with privious password and not
    const match = await bcrypt.compare(password, user.password);

    // if password is not match give the response and reject the request
    if (!match) {
      return commonUtils.sendErrorResponse(req, res, appStrings.WRONG_PASSWORD);
    }

    // generate the token
    const accessToken = token.generateAccessToken({ id: user._id });
    const refreshToken = token.generateRefreshToken({ id: user._id });

    // ============ store ACCESS token in cookie================
    commonUtils.storeAcessTokenInCookie(res, "accessToken", accessToken);

    // ============ store refresh token in cookie================
    commonUtils.storeRefreshTokenInCookie(res, "refreshToken", refreshToken);

    // Store Access & Refresh Tokens in Redis
    // await redisClient.set(accessToken, user._id.toString(), { EX: 600 });
    // await redisClient.set(refreshToken, user._id.toString(), { EX: 604800 });

    await redisClient.set(`user:access:${user._id}`, accessToken, {
      EX: config.REDIS_ACCESS_TOKEN_EXPIRE,
    });

    await redisClient.set(`user:refresh:${user._id}`, refreshToken, {
      EX: config.REDIS_REFRESH_TOKEN_EXPIRE,
    });

    // ==============send the response===========================
    return commonUtils.sendSuccessResponse(req, res, appStrings.LOGIN_SUCCESS, {
      user,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.LOGIN_FAILED,
      { error: err.message },
      500,
    );
  }
};

// ===================================get profile from token =========================================

async function getprofile(req, res) {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.INVALID_USER_ID,
        null,
        400,
      );
    }

    const userProfile = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
          isDeleted: ENUM.DELETE_STATUS.NOT_DELETE,
        },
      },
      {
        $lookup: {
          from: "addresses",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isPrimary", true] },
                  ],
                },
              },
            },
            { $project: { _id: 0, street: 1, city: 1, state: 1, zipCode: 1 } },
          ],
          as: "primaryAddress",
        },
      },
      {
        $unwind: {
          path: "$primaryAddress",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          status: 1,
          profileImage: 1,
          primaryAddress: 1,
        },
      },
    ]);

    if (!userProfile || userProfile.length === 0) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.USER_NOT_FOUND,
        null,
        404,
      );
    }

    const userData = userProfile[0];
    // Pass message if no primary address found
    if (!userData.primaryAddress) {
      userData.primaryAddress = appStrings.PRIMERY_ADSRESS_NOT_FOUND;
    }

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appStrings.USER_PROFILE,
      userData,
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.PROFILE_ERROR,
      { error: err.message },
      500,
    );
  }
}

// ==========================================soft delete=============================================
async function deletuser(req, res) {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isDeleted: ENUM.DELETE_STATUS.USER_DELETE,
      status: ENUM.USER_STATUS.INACTIVE,
    });

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appStrings.DELETE_SUCCSESS,
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.DELETE_ERROR,
      { error: err.message },
      500,
    );
  }
}

//=================================logout==============================================

const logout = async (req, res) => {
  try {
    // Get tokens from req or cookies
    const accessToken = req.accessToken || req.cookies.accessToken;
    const refreshToken = req.refreshToken || req.cookies.refreshToken;

    let userId;

    // Prefer refresh token (usually longer lived & required for full logout)
    const tokenToDecode = refreshToken || accessToken;

    if (tokenToDecode) {
      try {
        // Use the same verification you use in refreshAccessToken
        const decoded = token.verifyAccessToken
          ? token.verifyAccessToken(tokenToDecode) // if you have this
          : token.verifyRefreshToken(tokenToDecode); // or use refresh verifier if only that exists

        userId = decoded.id;
      } catch (e) {
        // If verification fails, we still want to clear cookies
        console.warn("Failed to decode token in logout:", e.message);
      }
    }

    // If we have userId, delete the correct Redis keys
    if (userId) {
      await redisClient.del(`user:access:${userId}`);
      await redisClient.del(`user:refresh:${userId}`);
    }

    if (accessToken) {
      await redisClient.del(accessToken);
    }
    if (refreshToken) {
      await redisClient.del(refreshToken);
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return commonUtils.sendSuccessResponse(req, res, appStrings.LOGOUT_SUCCESS);
  } catch (err) {
    console.error("Logout error:", err);
    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.LOGOUT_ERROR,
      { error: err.message },
      500,
    );
  }
};

//==================== multiple file upload controller==============================

const multered = (req, res, next) => {
  try {
    const uploadPath = path.join(__dirname, "../../uploads/images");

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
      },
    });

    const upload = multer({
      storage,
      // limites of file capacity
      limits: {
        fileSize: 1 * 1024 * 1024, // 1MB per file
        files: 10, // up to 10 files
      },
    }).array("profileImage", 10);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return commonUtils.sendErrorResponse(
          req,
          res,
          appStrings.UPLOAD_MULTER_ERROR,
          { error: err.message },
          400,
        );
      } else if (err) {
        return commonUtils.sendErrorResponse(
          req,
          res,
          appStrings.UPLOAD_ERROR,
          { error: err.message },
          400,
        );
      }

      if (!req.files || req.files.length === 0) {
        return commonUtils.sendErrorResponse(
          req,
          res,
          appStrings.UOLOAD_MESSAGE,
          null,
          400,
        );
      }

      // only thise type of fle or image can be uploaded
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          fs.unlinkSync(file.path);
          return commonUtils.sendErrorResponse(
            req,
            res,
            appStrings.UPLOAD_VALIDATION,
            null,
            400,
          );
        }
        // check the fileSize
        if (file.size > 5 * 1024 * 1024) {
          fs.unlinkSync(file.path);
          return commonUtils.sendErrorResponse(
            req,
            res,
            appStrings.UPLOAD_LIMIT,
            null,
            400,
          );
        }
      }

      const files = req.files.map((file) => ({
        filename: file.filename,
        path: file.path,
        originalname: file.originalname,
      }));

      return commonUtils.sendSuccessResponse(
        req,
        res,
        appStrings.UPLOAD_SUCCESS,
        files,
      );
    });
  } catch (error) {
    return commonUtils.sendErrorResponse(req, res, error.message, null, 500);
  }
};

// ==================refresh token api=========================

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log("refreshToken cookie:", refreshToken);

    if (!refreshToken) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.REFRESH_TOKEN_MISSING,
        null,
        401,
      );
    }

    const decoded = token.verifyRefreshToken(refreshToken);
    console.log("decoded refresh token:", decoded);

    const newAccessToken = token.generateAccessToken({ id: decoded.id });

    commonUtils.storeAcessTokenInCookie(res, "accessToken", newAccessToken);

    await redisClient.set(`user:access:${decoded.id}`, newAccessToken, {
      EX: config.REDIS_ACCESS_TOKEN_EXPIRE,
    });

    commonUtils.storeAcessTokenInCookie(res, "accessToken", newAccessToken);

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appStrings.ACCESS_TOKEN_REFRESHED,
      { accessToken: newAccessToken },
    );
  } catch (err) {
    console.error("refreshAccessToken error:", err);

    if (err.name === "TokenExpiredError") {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.REFRESH_TOKEN_EXPIRE,
        null,
        401,
      );
    }

    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.INVALID_REFRESH_TOKEN,
      { error: err.message },
      401,
    );
  }
};

//========================== verify email otp =======================

const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 1. Basic input validation
    if (!email || !otp) {
      return commonUtils.sendErrorResponse(req, res, appStrings.EMAIL_OTP_REQUIRED);
    }

    // 2. Look up user
    const user = await User.findOne({ email });
    if (!user) {
      return commonUtils.sendErrorResponse(req, res, appStrings.USER_NOT_FOUND);
    }

    // 3. Check OTP exists and not expired
    if (!user.emailOtp || user.emailOtpExpire < Date.now()) {
      return commonUtils.sendErrorResponse(req, res, appStrings.OTP_EXPIRED);
    }

    // 4. Check OTP value
    if (user.emailOtp !== otp.toString()) {
      return commonUtils.sendErrorResponse(req, res, appStrings.INVALID_OTP);
    }

    // 5. Mark email verified & clear OTP
    user.isEmailVerfied = true;
    user.emailOtp = null;
    user.emailOtpExpire = null;
    await user.save();

    return commonUtils.sendSuccessResponse(req, res, appStrings.EMAIL_VERIFIED);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

//================= verify Mobile OTP=========================

const verifyMbileOtp = async (req, res) => {
  try {
    const { mobileNo, otp } = req.body;

    // 1. Basic input validation
    if (!mobileNo || !otp) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.MOBILE_OTP_REQUIRED,
      );
    }

    // 2. Look up user
    const user = await User.findOne({ mobileNo });
    if (!user) {
      return commonUtils.sendErrorResponse(req, res, appStrings.USER_NOT_FOUND);
    }

    // 3. Check OTP exists and not expired
    if (!user.otp || user.otpExpire < Date.now()) {
      return commonUtils.sendErrorResponse(req, res, appStrings.OTP_EXPIRED);
    }

    // 4. Check OTP value
    if (user.otp !== otp.toString()) {
      return commonUtils.sendErrorResponse(req, res, appStrings.INVALID_OTP);
    }

    // 5. Mark email verified & clear OTP
    user.isMobileVerfied = true;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    return commonUtils.sendSuccessResponse(req, res, appStrings.MOBILE_VERIFIED);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

//================= resend Email Otp=========================

const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return commonUtils.sendErrorResponse(req, res, appStrings.EMAIL_REQUIRED, null);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.USER_NOT_FOUND,
        null,
      );
    }

    /*
    if (user.isEmailVerfied) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        "email already verified",
        null
      );
    }
    */

    if (user.emailOtpLastSend && Date.now() - user.emailOtpLastSend < 60000) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.WAIT_FOR_OTP,
        null,
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.emailOtp = otp;
    user.emailOtpExpire = Date.now() + 5 * 60 * 1000;
    user.emailOtpLastSend = Date.now();

    user.isEmailVerfied = false;

    await user.save();
    await sendVerificationEmail(email, otp);

    return commonUtils.sendSuccessResponse(req, res, appStrings.OTP_RESENT_SUCCESS, user);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

//================= resend rMobile Otp=========================

const resendMobileOtp = async (req, res) => {
  try {
    const { mobileNo } = req.body;

    if (!mobileNo) {
      return commonUtils.sendErrorResponse(req, res, appStrings.MOBILE_NUMBER_REQUIRED, null);
    }

    const user = await User.findOne({ mobileNo });
    if (!user) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.USER_NOT_FOUND,
        null,
      );
    }

    // if (user.isMobileVerfied) {
    //   return commonUtils.sendErrorResponse(
    //     req,
    //     res,
    //     "mobile no. already verified",
    //     null,
    //   );
    // }

    if (user.mobileOtpLastSend && Date.now() - user.mobileOtpLastSend < 60000) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.WAIT_FOR_OTP_MOBILE,
        null,
      );
    }
    const otp = Math.floor(100000 + Math.random() * 900000);

    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;
    user.mobileOtpLastSend = Date.now();

    user.isMobileVerfied = false;
    await user.save();
    await sendOtp(mobileNo, otp);

    return commonUtils.sendSuccessResponse(req, res, appStrings.OTP_RESENT_MOBILE, user);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

//=======update profile===============

const updateProfile = async (req, res) => {
  const userId = req.headers.id;
  try {
    let { name, email, mobileNo } = req.body;

    if (!userId) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.USER_ID_HEADER_MISSING,
        null,
      );
    }

    // Fetch user to check existing fields
    const user = await User.findById(userId);
    if (!user) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.USER_NOT_FOUND,
        null,
        404,
      );
    }

    console.log("Current user in DB:", {
      email: user.email,
      mobileNo: user.mobileNo,
    });
    console.log("Request body:", { name, email, mobileNo });

    const updateData = {};

    if (name) updateData.name = name.trim();

    // Email restriction logic
    if (email) {
      email = email.trim().toLowerCase();

      // If user already has an email and it's different from what they sent
      if (user.email && user.email.toLowerCase() !== email) {
        console.log("Blocking email change:", {
          existing: user.email,
          new: email,
        });
        return commonUtils.sendErrorResponse(
          req,
          res,
          appStrings.EMAIL_CHANGE_RESTRICTION,
        );
      }

      // If email is not set (null, undefined, or empty string), allow adding it
      if (!user.email || user.email.trim() === "") {
        const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
        updateData.email = email;
        updateData.isEmailVerfied = false;
        updateData.emailOtp = emailOtp;
        updateData.emailOtpExpire = Date.now() + 5 * 60 * 1000;
        await sendVerificationEmail(email, emailOtp);
      }
    }

    // Mobile restriction logic
    if (mobileNo) {
      let formattedMobile;
      try {
        formattedMobile = normalizeIndianMobile(mobileNo);
      } catch (e) {
        return commonUtils.sendErrorResponse(req, res, e.message);
      }

      // If user already has a mobile and it's different
      if (user.mobileNo && user.mobileNo.toString() !== formattedMobile) {
        console.log("Blocking mobile change:", {
          existing: user.mobileNo,
          new: formattedMobile,
        });
        return commonUtils.sendErrorResponse(
          req,
          res,
          appStrings.MOBILE_CHANGE_RESTRICTION,
        );
      }

      // If mobile is not set, allow adding it
      if (!user.mobileNo) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        updateData.mobileNo = formattedMobile;
        updateData.isMobileVerfied = false;
        updateData.otp = otp;
        updateData.otpExpire = Date.now() + 5 * 60 * 1000;

        const mobileForSms = `+91${formattedMobile}`;
        await sendOtp(mobileForSms, otp);
      }
    }

    console.log("Fields to update:", updateData);

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appStrings.PROFILE_UPDATE_SUCCESS,
      updatedUser,
    );
  } catch (err) {
    console.error("Profile update error:", err);
    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.SERVER_ERROR,
      null,
    );
  }
};


// ================== Get Reward Points History ==================
const getRewardHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalResults = await RewardHistory.countDocuments({ userId });
    const history = await RewardHistory.find({ userId })
      .populate("userId", "name", " email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appStrings.FETCH_REWARD,
      {
        pagination: {
          totalResults,
          totalPages: Math.ceil(totalResults / limit),
          currentPage: page,
          limit: limit,
        },
        history,
      },
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

module.exports = {
  register,
  login,
  getprofile,
  deletuser,
  logout,
  multered,
  refreshAccessToken,
  verifyEmailOtp,
  verifyMbileOtp,
  resendEmailOtp,
  resendMobileOtp,
  updateProfile,
  getRewardHistory,
};
