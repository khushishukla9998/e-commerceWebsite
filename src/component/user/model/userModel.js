const mongoose = require("mongoose");
const Address = require("./addressModel");

const ENUM = require("../../utils/enum");
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    //  unique: true,
    //   sparse:true,
  },
  cust_id: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  mobileNo: {
    type: Number,
    // unique: true,
    //  sparse:true,
  },
  rewardPoints: {
    type: Number,
    default: 0,
  },
  profileImage: {
    type: String,
  },
  status: {
    type: Number,
    default: ENUM.USER_STATUS.ACTIVE,
  },
  isDeleted: {
    type: Number,
    default: ENUM.DELETE_STATUS.NOT_DELETE,
  },
  deletedBy: {
    type: mongoose.Types.ObjectId,
  },
  isEmailVerfied: {
    type: Boolean,
    default: false,
  },
  isMobileVerfied: {
    type: Boolean,
    default: false,
  },

  otp: String,
  otpExpire: Date,
  emailOtp: String,
  emailOtpExpire: Date,
  emailOtpLastSend: Date,
  mobileOtpLastSend: Date,
});

const User = mongoose.model("User", userSchema);
module.exports = User;
