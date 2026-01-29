const express = require("express");
const routes = express.Router();
const controller = require("./controller/userController");
const addcontroller = require("./controller/addressController")
const authValidator = require("./validation");
// const addController = require("./controller/addressController");

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
  {
    path: "/addAdrress",
    method: "post",
    controller: addcontroller.addAdress,
    // validation: [...authValidator.registerValidator(), authValidator.validate],
  
  },
    {
    path: "/getaddress",
    method: "get",
    controller: addcontroller.getaddress,
    // validation: [...authValidator.registerValidator(), authValidator.validate],

},
];
