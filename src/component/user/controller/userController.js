
const User = require("../model/userModel")
const bcrypt = require("bcryptjs");
const token = require("../../../middleware/index");
const ENUM = require("../../utils/enum");
const STRINGS = require("../../utils/appString");
const utils = require("../../utils/commonUtils");
const { upload } = require("../../utils/commonUtils");




//====================REGISTER=======================================================\\

const register = async function (req, res) {
  try {
    const { name, email, password } = req.body;
    console.log(req.body);

    const profileImage = req.file ? req.file.path : null;

    // user exist or not
    const userExist = await User.findOne({
      email,
      isDeleted: ENUM.DELETE_STATUS.NOT_DELETE,
    });

    if (userExist) {
      return utils.sendErrorResponse(
        res,
        "user already exist",
        null,
        409 // conflict
      );
    }

    // hash password
    const hashpass = await bcrypt.hash(password, 10);

    // create user
    const user = new User({
      name,
      email,
      password: hashpass,
      profileImage,
      // status: ENUM.USER_STATUS.ACTIVE
    });

    await user.save();

    // generate access & refresh token
    const accessToken = token.generateAccessToken({ id: user._id });
    const refreshToken = token.generateRefreshToken({ id: user._id });

    // store tokens in cookies
    utils.storeAcessTokenInCookie(res, "accessToken", accessToken);
    utils.storeRefreshTokenInCookie(res, "refreshToken", refreshToken);

    // send success response
    return utils.sendSuccessResponse(res, "user registered", {
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
    console.log("registration error", err);
    return utils.sendErrorResponse(
      res,
      "registration failed",
      { error: err.message },
      500
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
      isDeleted:ENUM.DELETE_STATUS.NOT_DELETE
    });

    // if user not active or not register
   if (!user) {
  return utils.sendErrorResponse(res, STRINGS.USER_NOT_FOUND);
}

    // copare the password which is enter by the user is correct with privious password and not
    const match = await bcrypt.compare(password, user.password);

    // if password is not match give the response and reject the request
   if (!match) {
  return utils.sendErrorResponse(res, STRINGS.WRONG_PASSWORD);
}

      // generate the token
    const accessToken = token.generateAccessToken({id:user._id});
    const refreshToken = token.generateRefreshToken({id:user._id});

  
  

    // if (redisClient) {
    //   await redisClient.set(user._id.toString(), refreshToken, {
    //     EX: 7 * 24 * 60 * 60, // 7 days expiry
    //   });
    // }

    
 // ============ store ACCESS token in cookie================
    utils.storeAcessTokenInCookie( res,"accessToken", accessToken) 

// ============ store refresh token in cookie================
    utils.storeRefreshTokenInCookie(res,"refreshToken",refreshToken)

// ==============send the response===========================
    return utils.sendSuccessResponse(res,STRINGS.LOGIN_SUCCESS,
{
      user,
      accessToken,
      refreshToken
}
    );

 } catch (err) {
    return utils.sendErrorResponse(
      res,
      'login is failed',
      { error: err.message },
      500
    );
  }
}

// ===================================get profile from token =========================================

async function getprofile(req, res) {
  try {
    const userId = req.headers.id;
    console.log("uddd" )
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.json({ message: "user not found" });
    }
    res.json({
      message: "user profile",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (err) {
    res.json({ message: "profile error", err: err.message });
  }
}

// ==========================================soft delete=============================================
async function deletuser(req, res) {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isDeleted: ENUM.DELETE_STATUS.DELETE,
      status: ENUM.USER_STATUS.INACTIVE,
    });

    res.json({ message: "user soft deleted" });
  } catch (err) {
    res.json({ message: "delete error", err: err.message });
  }
}

//logout
async function logout(req, res) {
  try {
    res.clearCookie("refreshToken");
    res.json({ message: "logout successful" });
  } catch (err) {
    res.json({ message: "logout error", err: err.message });
  }
}

//for image upload



// ✅ multiple file upload api



// ✅ multiple file upload controller
const multered = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const files = req.files.map((file) => ({
      filename: file.filename,
      path: file.path,
      originalname: file.originalname,
    }));

    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      data: files,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};







module.exports = { register, login, getprofile, deletuser, logout ,multered};
