const User = require("../model/userModel");
const mongoose = require("mongoose");
const Address = require("../model/addressModel");
const bcrypt = require("bcryptjs");
const token = require("../../../middleware/index");
const ENUM = require("../../utils/enum");
const appStrings = require("../../utils/appString");
const commonUtils = require("../../utils/commonUtils");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const redisClient = require("../../utils/redisClient");


//====================REGISTER=======================================================\\

const register = async function (req, res) {
  try {
    console.log("request", req);

    const { name, email, password, profileImage } = req.body;
    console.log(req.body);

    // user exist or not
    const userExist = await User.findOne({
      email,
      isDeleted: ENUM.DELETE_STATUS.NOT_DELETE,
    });

    if (userExist) {
      return commonUtils.sendErrorResponse(req, res, appStrings.USER_EXIST, null, 409);
    }

    // hash password
    const hashpass = await bcrypt.hash(password, 10);

    // create user
    const user = new User({
      name,
      email,
      password: hashpass,
      profileImage,
    });

    await user.save();

    // generate access & refresh token
    const accessToken = token.generateAccessToken({ id: user._id });
    const refreshToken = token.generateRefreshToken({ id: user._id });

    // store tokens in cookies
    commonUtils.storeAcessTokenInCookie(res, "accessToken", accessToken);
    commonUtils.storeRefreshTokenInCookie(res, "refreshToken", refreshToken);

     // Store Access & Refresh Tokens in Redis
    // await redisClient.set(user._id.toString(),accessToken , { EX: 600 });
    // await redisClient.set(user._id.toString(),refreshToken,  { EX: 604800 }); // 7 days
  
await redisClient.set(`user:access:${user._id}`, accessToken, { EX: 600 });


await redisClient.set(`user:refresh:${user._id}`, refreshToken, { EX: 604800 });


    // send success response
    return commonUtils.sendSuccessResponse(req, res, appStrings.REGISTRATION_SUCCESS, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        status: ENUM.USER_STATUS,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.log(appStrings.REGISTRATION_ERROR, err);
    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.REGISTRATION_FAILED,
      { error: err.message },
      500,
    );
  }
};

//========================LOGIN=============================================================================//

// login user after registration

const login = async function (req, res) {
  try {
    const { email, password } = req.body;
    // check the user is active
    const user = await User.findOne({
      email,
      isDeleted: ENUM.DELETE_STATUS.NOT_DELETE,
    });

    // if user not active or not register
    if (!user) {
      return commonUtils.sendErrorResponse(res, appStrings.USER_NOT_FOUND);
    }

    // compare the password which is enter by the user is correct with privious password and not
    const match = await bcrypt.compare(password, user.password);

    // if password is not match give the response and reject the request
    if (!match) {
      return commonUtils.sendErrorResponse(res, appStrings.WRONG_PASSWORD);
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


    await redisClient.set(`user:access:${user._id}`, accessToken, { EX: 600 });


await redisClient.set(`user:refresh:${user._id}`, refreshToken, { EX: 604800 });

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
    const userId = req.headers.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const userProfile = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
          isDeleted: false // Assuming boolean based on model, or check ENUM if needed but model has default false
        },
      },
      {
        $lookup: {
          from: "addresses", // Collection name for Address model
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isPrimary", true] }
                  ]
                }
              }
            },
            { $project: { _id: 0, street: 1, city: 1, state: 1, zipCode: 1 } } // Only need specific fields
          ],
          as: "primaryAddress"
        }
      },
      {
        $unwind: {
          path: "$primaryAddress",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          status: 1,
          profileImage: 1,
          primaryAddress: 1 // Will be an object or null
        }
      }
    ]);

    if (!userProfile || userProfile.length === 0) {
      return res.json({ message: appStrings.USER_NOT_FOUND });
    }

    const userData = userProfile[0];
    // Pass message if no primary address found
    if (!userData.primaryAddress) {
      userData.primaryAddress = appStrings.PRIMERY_ADSRESS_NOT_FOUND;
    }

    res.json({
      message: appStrings.USER_PROFILE,
      user: userData,
    });
  } catch (err) {
    res.json({ message: appStrings.PROFILE_ERROR, err: err.message });
  }
}

// ==========================================soft delete=============================================
async function deletuser(req, res) {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isDeleted: ENUM.DELETE_STATUS.DELETE,
      status: ENUM.USER_STATUS.INACTIVE,
    });

    res.json({ message: appStrings.DELETE_SUCCSESS });
  } catch (err) {
    res.json({ message: appStrings.DELETE_ERROR, err: err.message });
  }
}

//logout




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
      500
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
        const uniqueName =
          Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
      },
    });

    const upload = multer({
      storage,
      // limites of file capacity
      limits: {
        fileSize: 1 * 1024 * 1024, // 1MB per file
        files: 10,                 // up to 10 files
      },
    }).array("profileImage", 10);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: appStrings.UPLOAD_MULTER_ERROR,
          error: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: appStrings.UPLOAD_ERROR,
          error: err.message,
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: appStrings.UOLOAD_MESSAGE,
        });
      }

      // only thise type of fle or image can be uploaded
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            error: appStrings.UPLOAD_VALIDATION,
          });
        }
        // check the fileSize
        if (file.size > 5 * 1024 * 1024) {
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            error: appStrings.UPLOAD_LIMIT,
          });
        }
      }

      const files = req.files.map((file) => ({
        filename: file.filename,
        path: file.path,
        originalname: file.originalname,
      }));

      return res.status(200).json({
        success: true,
        message: appStrings.UPLOAD_SUCCESS,
        data: files,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// refresh token api 
 const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log('refreshToken cookie:', refreshToken);

    if (!refreshToken) {
      return res.status(401).json({ message: appStrings.REFRESH_TOKEN_MISSING });
    }

    const decoded = token.verifyRefreshToken(refreshToken);
    console.log('decoded refresh token:', decoded);

    const newAccessToken = token.generateAccessToken({ id: decoded.id });

    commonUtils.storeAcessTokenInCookie(res, "accessToken", newAccessToken);

  
  await redisClient.set(`user:access:${decoded.id}`, newAccessToken, { EX: 600 });
    

    commonUtils.storeAcessTokenInCookie(
       res,
      "accessToken",
      newAccessToken
    );

    return res.status(200).json({
      message: appStrings.ACCESS_TOKEN_REFRESHED,
      accessToken: newAccessToken
    });
  } catch (err) {
    console.error('refreshAccessToken error:', err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: appStrings.REFRESH_TOKEN_EXPIRE
      });
    }

    return res.status(401).json({
      message:appStrings.INVALID_REFRESH_TOKEN,
      error: err.message
    });
  }
};



module.exports = { register, login, getprofile, deletuser, logout, multered ,refreshAccessToken};
