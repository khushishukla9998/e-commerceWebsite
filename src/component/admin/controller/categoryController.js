const { default: mongoose } = require("mongoose");
const Category = require("../model/categoryModel");
const { error } = require("node:console");

const addCategory = async (req, res) => {
  try {
    const { categoryName, image } = req.body;

    const exist = await Category.findOne({
      categoryName,
      parentCategoryId: null,
    });

    if (exist) {
      return res.status(400).json({
        success: false,
        message: "category already exist ",
      });
    }

    const category = await Category.create({
      categoryName,
      image,
      parentCategoryId: null,
    });
    return res.status(200).json({
      success: true,
      message: "category added successfull",
      data: category,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
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
        message: " Parent category not found ",
      });
    }

    if (!mongoose.Types.ObjectId) {
      return res.status(400).json({
        success: false,
        message: " invalid Parent Category  ",
      });
    }
    const exist = await Category.findOne({ categoryName, parentCategoryId });
    if (exist) {
      return res.status(400).json({
        success: false,
        message: " SubCategory already exist in thise category ",
      });
    }

    const subCategory = await Category.create({
      categoryName,
      parentCategoryId,
    });
    return res.status(200).json({
      success: true,
      message: "Subcategory added successfull within Category ",
      data: subCategory,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
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
          categoryName: 1,
          subcategories: 1,
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
        message: "Invalid SubCategory id",
      });
    }

    const subCategory = await Category.findOne({
      _id: subCategoryId,
      parentCategoryId: { $ne: null },
    });

    if (!subCategory) {
      return res.status(400).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    await Category.findByIdAndDelete(subCategoryId);

    return res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
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
        message: "Invalid Category id",
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
        message: "category not found",
      });
    }

    await Category.deleteMany({ parentCategoryId: categoryId });

    await Category.findByIdAndDelete(categoryId);

    return res.status(200).json({
      success: true,
      message: " Category and it's sub category are deleted ",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

//================update Caregory============================

const updateCatrgory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { categoryName, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category id",
      });
    }

    if (!categoryName && status === undefined) {
      return res.status(400).json({
        success: false,
        message: "nothing to uipdate",
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
        message: "category not found",
      });
    }

    if (categoryName) category.categoryName = categoryName;
    if (status !== undefined) category.status = status;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "category updated",
      data: category
    });


  } catch (err) {

    return res.status(400).json({
      success: false,
      error: err.message,
    })

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
        message: "Invalid Category id",
      });
    }

    if (!categoryName && status === undefined) {
      return res.status(400).json({
        success: false,
        message: "nothing to uipdate",
      });
    }
    const subCategory = await Category.findOne({
      _id: subCategoryId,
      parentCategoryId: { $ne: null },
    });

    if (!subCategory) {
      return res.status(400).json({
        success: false,
        message: "category not found",
      });
    }

    if (categoryName) subCategory.categoryName = categoryName;
    if (status !== undefined) subCategory.status = status;
    await subCategory.save();

    return res.status(200).json({
      success: true,
      message: " sub category updated",
      data: subCategory
    });


  } catch (err) {

    return res.status(400).json({
      success: false,
      error: err.message,
    })

  }
};
module.exports = {
  addCategory,
  addSubCategory,
  listCategory,
  deleteSubCategory,
  deleteCategory,
  updateCatrgory,
  updateSubCatrgory
};
