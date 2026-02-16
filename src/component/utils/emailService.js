// const nodemailer = require("nodemailer")
//  const config = require("../../../config/dev.json")
// ///email/////================
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: config.EMAIL_SENDER,
//         pass: config.EMAIL_PASSWORD,
//       },
//     });

//     const sendVerificationEmail = async(email,token)=>{
//       const url =`http://localhost:3001/api/verify-email/${token}`;

//     const templatePath = path.join(__dirname, "..", "..", "..", "ejsTemplate", "otp.ejs")
//     const html = await ejs.renderFile(templatePath, data)

//     await transporter.sendMail({
//       from: config.EMAIL_SENDER,
//       to: email,
//       subject: "OTP Verification",
//       html: html
//       //  `<h3> YOUR OTP is: ${otp}</h3> <p>Your OTP is valid for 10 min</p>`,
//     })
//     }

//     module.exports=sendVerificationEmail

const nodemailer = require("nodemailer");
const config = require("../../../config/dev.json");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL_SENDER,
    pass: config.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, emailOtp) => {

  await transporter.sendMail({
    from: config.EMAIL_SENDER,
    to: email,
    subject: "Email Verification",
   html: `<h2> Your otp is :${emailOtp}</h2>`
    
   
  });
};

module.exports = sendVerificationEmail;
