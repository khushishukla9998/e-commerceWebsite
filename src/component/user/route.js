const express = require("express");
const controller = require("./controller/userController");
const addcontroller = require("./controller/addressController");
const authValidator = require("./validation");
const passwordController = require("../user/controller/passwordController");
const cartController = require("./controller/cartController");

console.log("Loading User Routes...");

module.exports = [
  //*******************=============USER REGISTRATION===============*************************
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

  //*******************=============ADDRESS=====================*************************
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

  //*******************=============REFRESH TOKEN===============*************************

  {
    path: "/refresh-token",
    method: "post",
    controller: controller.refreshAccessToken,
    isPublic: true   //  access token nahi chahiye, sirf refresh token cookie

  },


  //*******************=============RESET PASSWORD===============*************************
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


  //*******************=============CART=====================*************************
  {
    path: "/addToCart",
    method: "post",
    controller: cartController.addToCart,
  },
  {
    path: "/getCart",
    method: "get",
    controller: cartController.getCart,
  },
  {
    path: "/updateCartItem",
    method: "put",
    controller: cartController.updateCartItem,
  },
  {
    path: "/removeCartItem/:productId",
    method: "delete",
    controller: cartController.removeCartItem,
  },

];
