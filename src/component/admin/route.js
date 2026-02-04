const express = require("express");
const adminController = require("./controller/adminController")


console.log("Loading User Routes...");

module.exports = [
 
//   {
//     path: "/refresh-token",
//     method: "post",
//     controller: controller.refreshAccessToken,
//     isPublic: true   //  access token nahi chahiye, sirf refresh token cookie

//   },
{
   path: "/registerAdmin",
    method: "post",
    controller: adminController.registerAdmin,
    isPublic: true 
},
{
   path: "/loginAdmin",
    method: "post",
    controller:adminController.adminLogin,
    isPublic: true 
},
{
   path: "/getallUsers",
    method: "get",
    controller:adminController.getAlluser,

},


];
