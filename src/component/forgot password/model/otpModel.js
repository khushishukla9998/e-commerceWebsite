const mongoose = require("mongoose");

const ENUM = require("../../utils/enum");
const otpSchema = mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  email: String,
  otp: { type: String, length: 6 },
  expiry: { type: Date, default: Date.now },
  
  isVerified: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Otp", otpSchema);
