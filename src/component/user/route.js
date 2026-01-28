const express = require("express");
const routes = express.Router();
const controller = require("./controller/userController");
const authValidator = require("./validation");

module.exports = [
  {
    path: "/register",
    method: "post",
    controller: controller.register,
    // validation: [...authValidator.registerValidator(), authValidator.validate],
    validation: authValidator.registerValidation,
    isPublic: true,
  },
  {
    path: "/login",
    method: "post",
    controller: controller.login,

    // validation: [...authValidator.loginValidator(), authValidator.validate],
    isPublic: true,
  },
  {
    path: "/logout",
    method: "post",
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
];