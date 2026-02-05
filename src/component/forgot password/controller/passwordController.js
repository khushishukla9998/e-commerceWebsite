const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const User = require("../../user/model/userModel");
commonUtils = require("../../utils/commonUtils");
const Otp = require("../model/otpModel");
const { options } = require("..");
const { error } = require("node:console");
const path = require("path")
const ejs =require("ejs")


const Otp_expiry = 10 * 60 * 1000; // 10 min

const generateOtp = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
};

const fotgotPassword = async (req, res) => {
  try {
    const { email, fromEmail, fromPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
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
        user: fromEmail,
        pass: fromPassword,
      },
    });

    const data={
      otp: otp,
      expiry:"10 minutes",
      email:email
    }
    const templatePath = path.join(__dirname ,"..","..","..","..","..","..", "templates","otp.ejs")
    const html = await ejs.renderFile(templatePath,data)
    await transporter.sendMail({
      from: "khushishukla9998@gmail.com",
      to: email,
      subject: "OTP Verification",
       html: html
      //  `<h3> YOUR OTP is: ${otp}</h3> <p>Your OTP is valid for 10 min</p>`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "OTP send failed",
      error: err.message,
    });
  }
};

//====================== reset otp ==========================//
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password, newPassword, oldPassword } = req.body;
    const normalizedEmail = email.toLowerCase();
    const otpString = otp.toString();

    const otpData = await Otp.findOne({
      email: normalizedEmail,
     isVerified:true
    });

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified",
      });
    }

    // if (otpData.expiry < Date.now()) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "OTP expired",
    //   });
    // }

    await User.findByIdAndUpdate(otpData.userId, {
      password,
    });

    // delete used otp// old otp
    await Otp.deleteOne({ _id: otpData._id });

    return res.status(200).json({
      success: true,
      message: "password reset",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "password reset failed",
      error: err.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;          // correctly read email
    const normalizedEmail = email.toLowerCase();

    const otpData = await Otp.findOne({ email: normalizedEmail, otp });

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "Invalid Otp",
      });
    }

    if (otpData.expiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Otp expired",
      });
    }

    otpData.isVerified = true;
    await otpData.save();
    return res.status(200).json({
      success: true,
      message: "Otp verified",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "server error",
      error: err.message,
    });
  }
};

module.exports = { fotgotPassword, resetPassword ,verifyOtp};
