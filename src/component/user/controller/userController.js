const User = require("../model/userModel");
const Address = require("../model/addressModel");
const bcrypt = require("bcryptjs");
const token = require("../../../middleware/index");
const ENUM = require("../../utils/enum");
const STRINGS = require("../../utils/appString");
const utils = require("../../utils/commonUtils");
//const {upload} = require("../../utils/commonUtils")
const multer = require("multer");
const path = require("path");
const fs = require("fs");

//====================REGISTER=======================================================\\

const register = async function (req, res) {
  try {
    console.log("request", req);

    const { name, email, password, profileImage} = req.body;
    console.log(req.body);

    // user exist or not
    const userExist = await User.findOne({
      email,
      isDeleted: ENUM.DELETE_STATUS.NOT_DELETE,
    });

    if (userExist) {
      return utils.sendErrorResponse(req, res, STRINGS.USER_EXIST, null, 409);
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
    utils.storeAcessTokenInCookie(res, "accessToken", accessToken);
    utils.storeRefreshTokenInCookie(res, "refreshToken", refreshToken);

    // send success response
    return utils.sendSuccessResponse(req, res, STRINGS.REGISTRATION_SUCCESS, {
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
    console.log(STRINGS.REGISTRATION_ERROR, err);
    return utils.sendErrorResponse(
      req,
      res,
      STRINGS.REGISTRATION_FAILED,
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
      return utils.sendErrorResponse(res, STRINGS.USER_NOT_FOUND);
    }

    // compare the password which is enter by the user is correct with privious password and not
    const match = await bcrypt.compare(password, user.password);

    // if password is not match give the response and reject the request
    if (!match) {
      return utils.sendErrorResponse(res, STRINGS.WRONG_PASSWORD);
    }

    // generate the token
    const accessToken = token.generateAccessToken({ id: user._id });
    const refreshToken = token.generateRefreshToken({ id: user._id });

    // ============ store ACCESS token in cookie================
    utils.storeAcessTokenInCookie(res, "accessToken", accessToken);

    // ============ store refresh token in cookie================
    utils.storeRefreshTokenInCookie(res, "refreshToken", refreshToken);

    // ==============send the response===========================
    return utils.sendSuccessResponse(req,res, STRINGS.LOGIN_SUCCESS, {
      user,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    return utils.sendErrorResponse(
      req,
      res,
      STRINGS.LOGIN_FAILED,
      { error: err.message },
      500,
    );
  }
};

// ===================================get profile from token =========================================

async function getprofile(req, res) {
  try {
    const userId = req.headers.id;
    console.log("uddd");
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.json({ message: STRINGS.USER_NOT_FOUND });
    }
    res.json({
      message: STRINGS.USER_PROFILE,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (err) {
    res.json({ message: STRINGS.PROFILE_ERROR, err: err.message });
  }
}

// ==========================================soft delete=============================================
async function deletuser(req, res) {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isDeleted: ENUM.DELETE_STATUS.DELETE,
      status: ENUM.USER_STATUS.INACTIVE,
    });

    res.json({ message:STRINGS.DELETE_SUCCSESS});
  } catch (err) {
    res.json({ message: STRINGS.DELETE_ERROR, err: err.message });
  }
}

//logout
async function logout(req, res) {
  try {
    res.clearCookie("refreshToken");
    res.json({ message: STRINGS.LOGOUT_SUCCESS });
  } catch (err) {
    res.json({ message: STRINGS.LOGOUT_ERROR, err: err.message });
  }
}

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
          message: STRINGS.UPLOAD_MULTER_ERROR,
          error: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message:  STRINGS.UPLOAD_ERROR,
          error: err.message,
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: STRINGS.UOLOAD_MESSAGE,
        });
      }

      // only thise type of fle or image can be uploaded
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            error:STRINGS.UPLOAD_VALIDATION,
          });
        }
     // check the fileSize
        if (file.size > 5 * 1024 * 1024) {
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            error: STRINGS.UPLOAD_LIMIT,
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
        message:STRINGS.UPLOAD_SUCCESS,
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


/// add adresss
 const addAdress = async function (req, res) {
  try {
    const {street, city, state, zipCode, userId} = req.body;
    console.log(req.body)
    // 1. Validate Input
    // if (!userId || !street || !city || !state || !zipCode) {
    //   return utils.sendErrorResponse(
    //     req, res, STRINGS.ADDRESS_ERROR,
    //     { error: "All address fields (street, city, state, zipCode, userId) are required" },
    //     400
    //   );
    // }

    // 2. Check if User exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3.  Check for duplicate address for this user
    const duplicateAddress = await Address.findOne({ userId, street, city, state, zipCode });
    if (duplicateAddress) {
        return utils.sendErrorResponse(
            req, res, STRINGS.ADDRESS_ERROR,
            { error: "This address already exists for this user" },
            409
        );
    }

    // 4. Create and Save Address
    const address = new Address({
      street,
      city,
      state,
      zipCode,
      userId,
      // If this is the first address, set it as primary
      isPrimary: req.body.isPrimary || false 
    });

    await address.save();


    return utils.sendSuccessResponse(req, res, STRINGS.ADDRESS_ADDED, {
      address: address // Return the full created object
    });

  } catch (err) {
    return utils.sendErrorResponse(
      req, res, STRINGS.ADDRESS_ERROR,
      { error: err.message },
      500
    );
  }
};
module.exports = { register, login, getprofile, deletuser, logout, multered,addAdress};
