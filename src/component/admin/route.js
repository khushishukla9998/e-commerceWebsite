const express = require("express");
const adminController = require("./controller/adminController");
const categoryController = require("./controller/categoryController");

console.log("Loading User Routes...");

module.exports = [
  //   {
  //     path: "/refresh-token",
  //     method: "post",
  //     controller: controller.refreshAccessToken,
  //     isPublic: true   //  access token nahi chahiye, sirf refresh token cookie

  //   },

  //*******************=============ADMIN REGISTRATION===============*************************

  {
    path: "/registerAdmin",
    method: "post",
    controller: adminController.registerAdmin,
    isPublic: true,
  },
  {
    path: "/loginAdmin",
    method: "post",
    controller: adminController.adminLogin,
    isPublic: true,
  },
  {
    path: "/getallUsers",
    method: "get",
    controller: adminController.getAlluser,
  },
  {
    path: "/updateUserStatus",
    method: "post",
    controller: adminController.updateUserStatus,
  },

  //==============CATEGORY==============

  {
    path: "/addCategory",
    method: "post",
    controller: categoryController.addCategory,
  },

   {
    path: "/addSubCategory",
    method: "post",
    controller: categoryController.addSubCategory,
  },

  {
    path: "/listOfCategory",
    method: "get",
    controller: categoryController.listCategory,
  },

   {
    path: "/deleteSubCategory/:subCategoryId",
    method: "delete",
    controller: categoryController.deleteSubCategory,
  },

  {
    path: "/deleteCategory/:categoryId",
    method: "delete",
    controller: categoryController.deleteCategory,
  },

   {
    path: "/updateCategory/:categoryId",
    method: "put",
    controller: categoryController.updateCatrgory,
  },

   {
    path: "/updatesubCategory/:subCategoryId",
    method: "put",
    controller: categoryController.updateSubCatrgory,
  },



];
