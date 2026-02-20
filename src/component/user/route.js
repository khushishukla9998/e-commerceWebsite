const express = require("express");
const controller = require("./controller/userController");
const addcontroller = require("./controller/addressController");
const authValidator = require("./validation");
const passwordController = require("../user/controller/passwordController");
const cartController = require("./controller/cartController");
const orderController = require("./controller/orderController");
const productController = require("../admin/controller/productController");
const membershipController = require("./controller/membershipController");

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
  {
    path: "/validatePromo",
    method: "post",
    controller: cartController.validatePromo,
  },

  //*******************=============ORDER=====================*************************
  {
    path: "/placeOrder",
    method: "post",
    controller: orderController.placeOrder,
  },
  {
    path: "/cancelOrder",
    method: "post",
    controller: orderController.cancelOrder,
  },
  {
    path: "/getInvoice",
    method: "get",
    controller: orderController.getInvoice,
  },
  // {
  //   path: "/webhook",
  //   method: "post",
  //   controller: orderController.stripeWebhook,
  //   isPublic: true,
  // },
  {
    path: "/getUserOrders",
    method: "get",
    controller: orderController.getUserOrders,
  },
  {
    path: "/getProduct/:productId",
    method: "get",
    controller: productController.getProductById,
    isPublic: true,

  },
  {
    path: "/emailVerified",
    method: "post",
    controller: controller.verifyEmailOtp,
    isPublic: true,

  },
  {
    path: "/mobileVerified",
    method: "post",
    controller: controller.verifyMbileOtp,
    isPublic: true,

  },

  {
    path: "/resendEmailOtp",
    method: "post",
    controller: controller.resendEmailOtp,
    isPublic: true,

  },

  {
    path: "/resendMobileOtp",
    method: "post",
    controller: controller.resendMobileOtp,
    isPublic: true,

  },
  {
    path: "/updateProfile",
    method: "put",
    controller: controller.updateProfile,
  },

  //*******************=============MEMBERSHIP=====================*************************
  {
    path: "/listPlans",
    method: "get",
    controller: membershipController.listPlans,
    isPublic: true,
  },
  {
    path: "/purchaseMembership",
    method: "post",
    controller: membershipController.purchaseMembership,
  },
  {
    path: "/confirmMembership",
    method: "post",
    controller: membershipController.confirmMembership,
  },
];
