const express = require("express");
const adminController = require("./controller/adminController");
const categoryController = require("./controller/categoryController");
const productController = require("./controller/productController");

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
  {
    path: "/getUsersWithDetails",
    method: "get",
    controller: adminController.getAllUsersWithDetails,
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



  //==============PRODUCT==============

  {
    path: "/addProduct",
    method: "post",
    controller: productController.addProduct,
  },
  {
    path: "/listProduct",
    method: "get",
    controller: productController.listProduct,
  },
  {
    path: "/updateProduct/:productId",
    method: "put",
    controller: productController.updateProduct,
  },
  {
    path: "/deleteProduct/:productId",
    method: "delete",
    controller: productController.deleteProduct,
  },

];
