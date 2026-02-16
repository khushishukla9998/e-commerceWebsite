//  const twillio = require("twilio");
//  const config = require("../../../config/dev.json")

//  const client = twillio(
//   config.TWIILIO_SID,
//   config.TWILIO_AUTH_TOKEN

//  );

//  const sendOtp = async (mobile,otp)=>{
//     await client.messages.create({
//         body:`your otp is${otp}`,
//         from:config.TWILIO_PHONE,
//         to:mobile
//     });
//  }

//  module.exports=sendOtp;

// utils/smsService.js
const twilio = require("twilio");
const config = require("../../../config/dev.json");

const client = twilio(config.TWIILIO_SID, config.TWILIO_AUTH_TOKEN);

const sendOtp = async (mobileNo, otp) => {
  return client.messages.create({
    body: `Your OTP is ${otp}`,
  // messagingServiceSid: config.MESSAGING_SERVICE_SID,
     from:config.TWILIO_PHONE, 
    to: mobileNo,
  });
};

module.exports = sendOtp;
