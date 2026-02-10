const { default: mongoose } = require("mongoose");
const Category = require("../model/categoryModel");
const appString = require("../../utils/appString");
const commonUtils = require("../../utils/commonUtils");

const addCategory = async (req, res) => {
  try {
    const { categoryName, image } = req.body;

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
    const { categoryName, parentCategoryId } = req.body;

    const parentCategory = await Category.findOne({
      _id: parentCategoryId,
      parentCategoryId: null,
    });
    if (!parentCategory) {
      return res.status(400).json({
        success: false,
        message: appString.PARENT_CAT_NOT_FOUND,
      });
    }

    if (!mongoose.Types.ObjectId) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.INVALID_PARENT_CATEGORY,
        null,
      );

      // res.status(400).json({
      //   success: false,
      //   message: appString.INVALID_PARENT_CATEGORY,
      // });
    }
    const exist = await Category.findOne({ categoryName, parentCategoryId });
    if (exist) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.appString.SUB_CATEGORY_ADDED,
        null,
      );

      // res.status(400).json({
      //   success: false,
      //   message: appString.SUB_CATEGORY_ADDED,
      // });
    }

    const subCategory = await Category.create({
      categoryName,
      parentCategoryId,
    });
    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.SUB_CATEGORY_ADDED,
      null,
    );

    // res.status(200).json({
    //   success: true,
    //   message:appString.SUB_CATEGORY_ADDED,
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

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

//===========delete Sub Category==========================

const deleteSubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
      return res.status(400).json({
        success: false,
        message: appString.INVALID_SUB_CATEGORY,
      });
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

    return res.status(200).json({
      success: true,
      message: appString.SUB_CAT_DELETE,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

//============= delete category ======================

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: appString.INVALID_CATEGORY,
      });
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

    return res.status(200).json({
      success: true,
      message: appString.CAT_DELETE,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

//================update Category============================

const updateCatrgory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { categoryName, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: appString.INVALID_CATEGORY,
      });
    }

    if (!categoryName && status === undefined) {
      return res.status(400).json({
        success: false,
        message: appString.NOTHING_TO_UPDATE,
      });
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

    return res.status(200).json({
      success: true,
      message: appString.CAT_UPDETED,
      data: category,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};
//=======update Sub category=========
const updateSubCatrgory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const { categoryName, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
      return res.status(400).json({
        success: false,
        message: appString.INVALID_SUB_CATEGORY,
      });
    }

    if (!categoryName && status === undefined) {
      return res.status(400).json({
        success: false,
        message: appString.NOTHING_TO_UPDATE,
      });
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

    return res.status(200).json({
      success: true,
      message: appString.SUB_CAT_UPDETED,
      data: subCategory,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
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
