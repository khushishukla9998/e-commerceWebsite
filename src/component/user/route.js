const express = require("express");
const controller = require("./controller/userController");
const addcontroller = require("./controller/addressController");
const authValidator = require("./validation");

console.log("Loading User Routes...");

module.exports = [
  {
    path: "/register",
    method: "post",
    controller: controller.register,
    validation: authValidator.registerValidation,
    isPublic: true,
  },
  {
    path: "/login",
    method: "post",
    controller: controller.login,
    isPublic: true,
  },
  {
    path: "/logout",
    method: "delete",
    controller: controller.logout,
   
  },
  {
    path: "/getprofile",
    method: "get",
    controller: controller.getprofile,
  
  },
  {
    path: "/deleteUser",
    method: "delete",
    controller: controller.deletuser,
   
  },
  {
    path: "/addImage",
    method: "post",
    controller: controller.multered,
    isPublic: true,
  },
  {
    path: "/getAddress",
    method: "get",
    controller: addcontroller.getAddress,
   
   
  },
  {
    path: "/setPrimaryAddress",
    method: "put",
    controller: addcontroller.setPrimaryAddress,
   
  },
  {
    path: "/addAddress",
    method: "post",
    controller: addcontroller.addAddress,
   
    
  },

  {
    path: "/refresh-token",
    method: "post",
    controller: controller.refreshAccessToken,
    isPublic: true   //  access token nahi chahiye, sirf refresh token cookie

  },


];
