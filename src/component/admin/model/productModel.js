const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    images: {
        type: [String], // Array of strings for multiple images
        default: [],
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    status: {
        type: Number,
        enum: [0, 1],
        default: 0, // 0: Inactive, 1: Active
    },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
