const Admin = require("../model/adminModel");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const token = require("../../../middleware/index");
const ENUM = require("../../utils/enum");
const appStrings = require("../../utils/appString");
const commonUtils = require("../../utils/commonUtils");
const User = require("../../user/model/userModel");
const { lookup } = require("node:dns");

//=================register Admin ============================//
console.log("Body in adminLogin:");
const registerAdmin = async function (req, res) {
  try {
    const { name, email, password } = req.body;

    //  Check if there is already any (not deleted) admin
    const existingAdmin = await Admin.findOne({
      isDeleted: ENUM.DELETE_STATUS.NOT_DELETE,
    });

    if (existingAdmin) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.ADMIN_EXIST,
        null,
        409,
      );
    }

    //  additionally prevent duplicate email even if deleted
    const emailInUse = await Admin.findOne({ email });
    if (emailInUse) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.EMAIL_USE,
        null,
        409,
      );
    }

    // 3. Hash password
    const hashpass = await bcrypt.hash(password, 10);

    // 4. Create admin
    const admin = new Admin({
      name,
      email,
      password: hashpass,
    });

    await admin.save();

    const accessToken = token.generateAccessToken({
      id: admin._id,
      type: "ADMIN",
    });
    const refreshToken = token.generateRefreshToken({
      id: admin._id,
      type: "ADMIN",
    });
    commonUtils.storeAcessTokenInCookie(res, "accessToken", accessToken);
    commonUtils.storeRefreshTokenInCookie(res, "refreshToken", refreshToken);

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appStrings.REGISTRATION_SUCCESS,
      {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          status: ENUM.USER_STATUS.ACTIVE, // or correct value
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
      { error: err.message },
      500,
    );
  }
};

// =============== Admin Login===============

const adminLogin = async function (req, res) {
  try {
    const { email, password } = req.body;
    console.log("Body in adminLogin:", req.body);
    const admin = await Admin.findOne({
      email,
      isDeleted: ENUM.DELETE_STATUS.NOT_DELETE,
    });

    if (!admin) {
      return commonUtils.sendErrorResponse(req, res, appStrings.USER_NOT_FOUND);
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return commonUtils.sendErrorResponse(req, res, appStrings.WRONG_PASSWORD);
    }

    const accessToken = token.generateAccessToken({
      id: admin._id,
      type: "ADMIN",
    });
    const refreshToken = token.generateRefreshToken({
      id: admin._id,
      type: "ADMIN",
    });

    commonUtils.storeAcessTokenInCookie(res, "accessToken", accessToken);
    commonUtils.storeRefreshTokenInCookie(res, "refreshToken", refreshToken);

    return commonUtils.sendSuccessResponse(req, res, appStrings.LOGIN_SUCCESS, {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        status: ENUM.USER_STATUS.ACTIVE,
      },
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

// get list of user with address======================

const getAlluser = async (req, res) => {
  try {
    const { search } = req.query;

    let matchCondition = {};

    if (search) {
      matchCondition.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.aggregate([
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "addresses",
          localField: "_id",
          foreignField: "userId",
          as: "addresses",
        },
      },
      {
        $project: {
          name: "$name",
          email: "$email",
          addresses: "$addresess",
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      totalUsers: User.length,
      users,
    });
  } catch (err) {
    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.FAILED_FETCH,
      { error: err.message },
      500,
    );
  }
};

module.exports = { registerAdmin, adminLogin, getAlluser };
