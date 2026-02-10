const { default: mongoose } = require("mongoose");
const Product = require("../model/productModel");
const Category = require("../model/categoryModel");
const appString = require("../../utils/appString");
const commonUtils = require("../../utils/commonUtils");

// ============ Add Product ============
const addProduct = async (req, res) => {
  try {
    const {
      productName,
      description,
      price,
      images,
      categoryId,
      subCategoryId,
      quantity,
    } = req.body;

    if (!productName || !price || !categoryId || !subCategoryId || !quantity) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.REQUIRED_FIELDS,
        null,
      );
    }

   // Validate Category
    const category = await Category.findById(categoryId);
    if (!category) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.INVALID_CATEGORY,
        null,
      );
    }

    // Validate Subcategory
    const subCategory = await Category.findOne({
      _id: subCategoryId,
      parentCategoryId: { $ne: null },
    });
    if (!subCategory) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.INVALID_SUB_CATEGORY,
        null,
      );
    }

    // if  product already exist
    const exist = await Product.findOne({
      productName,
      subCategoryId,
    });

    if (exist) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.ALREADY_EXIST,
        null,
      );
    }

    const product = await Product.create({
      productName,
      description,
      price,
      images,
      categoryId,
      subCategoryId,
      quantity,
    });

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.ADDED_SUCCESS,
      product,
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

// ============ List Products ============
const listProduct = async (req, res) => {
  try {
    const { search } = req.query;

    const pipeline = [];

    // Search functionality
    if (search) {
      pipeline.push({
        $match: {
          productName: { $regex: search, $options: "i" },
        },
      });
    }

    // Lookup Category
    pipeline.push({
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    });

    // Lookup Subcategory
    pipeline.push({
      $lookup: {
        from: "categories",
        localField: "subCategoryId",
        foreignField: "_id",
        as: "subCategory",
      },
    });

    // Unwind lookups to get objects
    pipeline.push({
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push({
      $unwind: {
        path: "$subCategory",
        preserveNullAndEmptyArrays: true,
      },
    });

    // Project specific fields
    pipeline.push({
     $project: {
      productName: "$productName",
      description: "$description",
      price: "$price",
      images: "$images",
      status: "$status",
      quantity: "$quantity",
      
      category: {
        categoryName: "$category.categoryName",
        categoryId: "$category._id"
      },

      subCategory: {
        subCategoryName: "$subCategory.categoryName",
        subCategoryId: "$subCategory._id"
      }
    }
    });

    const products = await Product.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

// ============ Update Product ============
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = ({ productName, price, status, quantity, description } =
      req.body);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.INVALID_PRODUCT_ID,
        null,
      );
    }

    const product = await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
    });

    if (!product) {
      return commonUtils.sendErrorResponse(req, res, appString.NOT_FOUND, null);
    }

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.PR_UPDATE_SUCCESS,
      product,
    );
  } catch (err) {
    return commonUtils.sendSuccessResponse(req, res, err.message, null);
  }
};

// ============ Delete Product ============
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.INVALID_PRODUCT_ID,
        null,
      );
    }

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return commonUtils.sendErrorResponse(req, res, appString.NOT_FOUND, null);
    }

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.PR_DELETED_SUCCESS,
      null,
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

module.exports = {
  addProduct,
  listProduct,
  updateProduct,
  deleteProduct,
};
