const mongoose = require("mongoose");
const ENUM = require("../../utils/enum")

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
        required: true,
    },
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            productName: String,
            image: [String],
            price: Number,
            quantity: Number,
            subTotal: Number,
        },
    ],
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        
        enum: ENUM.ORDER_STATUS,
        default: ENUM.ORDER_STATUS.PENDING,
    },
    paymentStatus: {
        type: String,
        enum: ENUM.PAYMENT_STATUS,
        default: ENUM.PAYMENT_STATUS.PENDING,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    stripeSessionId: {
        type: String,
    },
    stripePaymentIntentId: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
