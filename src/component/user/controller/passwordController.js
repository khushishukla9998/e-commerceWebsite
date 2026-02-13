const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const User = require("../model/userModel");
const config = require("../../../../config/dev.json");
commonUtils = require("../../utils/commonUtils");
const Otp = require("../model/otpModel");
const path = require("path")
const ejs = require("ejs")
const bcrypt = require("bcryptjs");
const appString = require("../../utils/appString")


const Otp_expiry = 10 * 60 * 1000; // 10 min

const generateOtp = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
};

const fotgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return commonUtils.sendErrorResponse(req, res, appString.USER_NOT_FOUND, null, 400);
    }

    await Otp.deleteMany({ email: email.toLowerCase() });

    const otp = generateOtp();

    await Otp.create({
      userId: user._id,
      email: email.toLowerCase(),
      otp,
      expiry: Date.now() + Otp_expiry,
    });



    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.EMAIL_SENDER,
        pass: config.EMAIL_PASSWORD,
      },
    });

    const data = {
      name: user.name,
      otp: otp,
      expiry: "10 minutes",
      email: email
    }
    const templatePath = path.join(__dirname, "..", "..", "..", "ejsTemplate", "otp.ejs")
    const html = await ejs.renderFile(templatePath, data)

    await transporter.sendMail({
      from: config.EMAIL_SENDER,
      to: email,
      subject: "OTP Verification",
      html: html
      //  `<h3> YOUR OTP is: ${otp}</h3> <p>Your OTP is valid for 10 min</p>`,
    });

    return commonUtils.sendSuccessResponse(req, res, appString.OTP_SENT_SUCCESS);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, appString.OTP_SEND_FAILED, { error: err.message }, 500);
  }
};

//====================== reset otp ==========================//
const resetPassword = async (req, res) => {
  try {
    const { email, otp, oldPassword, newPassword, confirmPassword } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (newPassword !== confirmPassword) {
      return commonUtils.sendErrorResponse(req, res, appString.PASSWORD_MISMATCH, null, 400);
    }


    if (newPassword === oldPassword) {
      return commonUtils.sendErrorResponse(req, res, appString.PASSWORD_MATCH, null, 400);
    }



    const otpData = await Otp.findOne({
      email: normalizedEmail,
      isVerified: true
    });



    if (!otpData) {
      return commonUtils.sendErrorResponse(req, res, appString.OTP_NOT_VERFIFIED, null, 400);
    }
    const user = await User.findById(otpData.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: appString.USER_NOT_FOUND,
      });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return commonUtils.sendErrorResponse(req, res, appString.INCORRECT_OLD_PASSWORD, null, 400);
    }

    // Hash new password
    const hashPass = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
      password: hashPass,
    });

    // delete used otp
    await Otp.deleteOne({ _id: otpData._id });

    return commonUtils.sendSuccessResponse(req, res, appString.PAASWORD_RESET_SUCCESS);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, appString.PASSWORD_RESET_FAILED, { error: err.message }, 500);
  }
};

//==========verify OTP============

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase();

    const otpData = await Otp.findOne({ email: normalizedEmail, otp });

    if (!otpData) {
      return commonUtils.sendErrorResponse(req, res, appString.INVALID_OTP, null, 400);
    }

    if (otpData.expiry < Date.now()) {
      return commonUtils.sendErrorResponse(req, res, appString.OTP_EXPIRED, null, 400);
    }

    otpData.isVerified = true;
    await otpData.save();
    return commonUtils.sendSuccessResponse(req, res, appString.OTP_VERIFIED);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
  }
};

module.exports = { fotgotPassword, resetPassword, verifyOtp };
