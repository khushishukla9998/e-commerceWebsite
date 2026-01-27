const express = require("express");
const routes = express.Router();
const controller = require("./controller/userController");
// const auth = require("../middelware/auth")
const authValidator = require("./validation");
const { upload } = require("../utils/commonUtils");
const { verifyAcessToken } = require("../../middleware/index");

module.exports = [
  {
    path: "/register",
    method: "post",
    controller: controller.register,
    validation: authValidator.registervalidator, //authValidator.validate,
    isPublic: true,
  },
  {
    path: "/login",
    method: "post",
    controller: controller.login,
    validation: authValidator.registervalidator, //authValidator.validate,
    isPublic: true,
  },
  {
    path: "/logout",
    method: "post",
    controller: controller.logout,
    validation: authValidator.registervalidator, //authValidator.validate,
  },
  {
    path: "/getprofile",
    method: "get",
    controller: controller.getprofile,
    validation: authValidator.registervalidator, //authValidator.validate,
  },
  {
    path: "/deleteUser",
    method: "delete",
    controller: controller.deletuser,
    validation: authValidator.registervalidator, //authValidator.validate,
  },
  {
    path: "/addImage",
    method: "post",
    controller: controller.multerd,
    //validation: authValidator.registervalidator, //authValidator.validate,
  },
];
