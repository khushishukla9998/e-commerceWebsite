const { default: mongoose } = require("mongoose");
const Category = require("../model/categoryModel");
const appString = require("../../utils/appString");
const commonUtils = require("../../utils/commonUtils");

const addCategory = async (req, res) => {
  try {
    const { categoryName, image } = req.body;

    if (!categoryName || !image) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.REQUIRED_FIELDS,
        null,
        400,
      );
    }

    const exist = await Category.findOne({
      categoryName,
      parentCategoryId: null,
    });

    if (exist) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.CATEGORY_EXIST,
        null,
      );
    }

    const category = await Category.create({
      categoryName,
      image,
      parentCategoryId: null,
    });
    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.CATEGORY_ADDED,
      category,
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

//============ADD SubCategory===========================
const addSubCategory = async (req, res) => {
  try {
    const { categoryName, parentCategoryId, image } = req.body;

    if (!categoryName || !parentCategoryId || !image) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.REQUIRED_FIELDS,
        null,
        400,
      );
    }

    if (!mongoose.Types.ObjectId.isValid(parentCategoryId)) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.INVALID_PARENT_CATEGORY,
        null,
        400,
      );
    }

    const parentCategory = await Category.findOne({
      _id: parentCategoryId,
      parentCategoryId: null,
    });
    if (!parentCategory) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.PARENT_CAT_NOT_FOUND,
        null,
        400,
      );
    }

    const exist = await Category.findOne({ categoryName, parentCategoryId });
    if (exist) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.SUB_CATEGORY_EXIST,
        null,
        400
      );
    }

    const subCategory = await Category.create({
      categoryName,
      parentCategoryId,
      image,
    });
    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.SUB_CATEGORY_ADDED,
      subCategory,
    );

    // res.status(200).json({
    //   success: true,
    //   message:appStrings.SUB_CATEGORY_ADDED,
    //   data: subCategory,
    // });
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);

    // res.status(400).json({
    //   success: false,
    //   error: err.message,
    // });
  }
};

//============list of category ====================

const listCategory = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $match: {
          $or: [
            { parentCategoryId: null },
            { parentCategoryId: { $exists: false } },
          ],
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "parentCategoryId",
          as: "subcategories",
        },
      },
      //   {
      //     $group: {
      //       _id: "$_id",
      //       name: { $first: "$nparentCategoryIdame" },
      //       subcategories: { $first: "$subcategories" }
      //     }
      //   },
      {
        $project: {
          categoryName: "$categoryName",
          subcategories: "$subcategories",
        },
      },
    ]);

    return commonUtils.sendSuccessResponse(req, res, appString.FETCH_SUCCESS, {
      count: categories.length,
      categories: categories,
    });
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
  }
};

//===========delete Sub Category==========================

const deleteSubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
      return commonUtils.sendErrorResponse(req, res, appString.INVALID_SUB_CATEGORY, null, 400);
    }

    const subCategory = await Category.findOne({
      _id: subCategoryId,
      parentCategoryId: { $ne: null },
    });

    if (!subCategory) {
      return res.status(400).json({
        success: false,
        message: appString.SUB_CAT_NOT_FOUND,
      });
    }

    await Category.findByIdAndDelete(subCategoryId);

    return commonUtils.sendSuccessResponse(req, res, appString.SUB_CAT_DELETE);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
  }
};

//============= delete category ======================

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return commonUtils.sendErrorResponse(req, res, appString.INVALID_CATEGORY, null, 400);
    }

    const category = await Category.findOne({
      _id: categoryId,
      $or: [
        { parentCategoryId: null },
        { parentCategoryId: { $exists: false } },
      ],
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: appString.CAT_NOT_FOUND,
      });
    }

    await Category.deleteMany({ parentCategoryId: categoryId });

    await Category.findByIdAndDelete(categoryId);

    return commonUtils.sendSuccessResponse(req, res, appString.CAT_DELETE);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
  }
};

//================update Category============================

const updateCatrgory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { categoryName, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return commonUtils.sendErrorResponse(req, res, appString.INVALID_CATEGORY, null, 400);
    }

    if (!categoryName && status === undefined) {
      return commonUtils.sendErrorResponse(req, res, appString.NOTHING_TO_UPDATE, null, 400);
    }
    const category = await Category.findOne({
      _id: categoryId,
      $or: [
        { parentCategoryId: null },
        { parentCategoryId: { $exists: false } },
      ],
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: appString.CAT_NOT_FOUND,
      });
    }

    if (categoryName) category.categoryName = categoryName;
    if (status !== undefined) category.status = status;
    await category.save();

    return commonUtils.sendSuccessResponse(req, res, appString.CAT_UPDETED, category);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
  }
};
//=======update Sub category=========
const updateSubCatrgory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const { categoryName, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
      return commonUtils.sendErrorResponse(req, res, appString.INVALID_SUB_CATEGORY, null, 400);
    }

    if (!categoryName && status === undefined) {
      return commonUtils.sendErrorResponse(req, res, appString.NOTHING_TO_UPDATE, null, 400);
    }
    const subCategory = await Category.findOne({
      _id: subCategoryId,
      parentCategoryId: { $ne: null },
    });

    if (!subCategory) {
      return res.status(400).json({
        success: false,
        message: appString.SUB_CAT_NOT_FOUND,
      });
    }

    if (categoryName) subCategory.categoryName = categoryName;
    if (status !== undefined) subCategory.status = status;
    await subCategory.save();

    return commonUtils.sendSuccessResponse(req, res, appString.SUB_CAT_UPDETED, subCategory);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
  }
};
module.exports = {
  addCategory,
  addSubCategory,
  listCategory,
  deleteSubCategory,
  deleteCategory,
  updateCatrgory,
  updateSubCatrgory,
};
