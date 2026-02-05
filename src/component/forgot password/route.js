const passwordController = require("../forgot password/controller/passwordController")

console.log("Loading User Routes...");

module.exports = [

   
    {
        path: "/forgotPassword",
        method: "post",
        controller: passwordController.fotgotPassword,
        isPublic: true
    },
   
  {
     path: "/resetPassword",
        method: "post",
        controller: passwordController.resetPassword,
        isPublic: true
    },

 {
     path: "/verifyOTP",
        method: "post",
        controller: passwordController.verifyOtp,
        isPublic: true
    },

   

];