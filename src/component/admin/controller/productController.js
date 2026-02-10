const { default: mongoose } = require("mongoose");
const Product = require("../model/productModel");
const Category = require("../model/categoryModel");

// ============ Add Product ============
const addProduct = async (req, res) => {
    try {
        const { productName, description, price, images, categoryId, subCategoryId } = req.body;

        if (!productName || !price || !categoryId || !subCategoryId) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }

        // Validate Category
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: "Invalid Category ID",
            });
        }

        // Validate Subcategory
        const subCategory = await Category.findOne({ _id: subCategoryId, parentCategoryId: { $ne: null } });
        if (!subCategory) {
            return res.status(400).json({
                success: false,
                message: "Invalid Subcategory ID",
            });
        }

        const product = await Product.create({
            productName,
            description,
            price,
            images,
            categoryId,
            subCategoryId,
        });

        return res.status(200).json({
            success: true,
            message: "Product added successfully",
            data: product,
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
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

        // Unwind lookups to get objects instead of arrays (preserveNullAndEmptyArrays: true to keep products even if category missing)
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
                productName: 1,
                description: 1,
                price: 1,
                images: 1,
                status: 1,
                categoryName: "$category.categoryName",
                categoryId: "$category._id",
                subCategoryName: "$subCategory.categoryName",
                subCategoryId: "$subCategory._id",
            },
        });

        const products = await Product.aggregate(pipeline);

        return res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }
};

// ============ Update Product ============
const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Product ID",
            });
        }

        const product = await Product.findByIdAndUpdate(productId, updateData, { new: true });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product,
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }
};

// ============ Delete Product ============
const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Product ID",
            });
        }

        const product = await Product.findByIdAndDelete(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }
};

module.exports = {
    addProduct,
    listProduct,
    updateProduct,
    deleteProduct,
};
