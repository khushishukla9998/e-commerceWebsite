// user/model/UsedPromo.js
const mongoose = require("mongoose");
const ENUM = require("../../utils/enum")
const withdrawSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        memnberShipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserMembership"
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MembershipPlan"
        },
        planName: {
            type: String,
        },

        pointsUsed: {
            type: Number,
            required: true
        },

        amount: {
            type: Number,
            required: true
        },
        processingFeeAmount: {
            type: Number,
            default: 0
        },
        finelAmount: {
            type: Number,
            required: true
        },
        Priority: {
            type: Number,
            enum: Object.values(ENUM.PRIORITY),
            default: ENUM.PRIORITY.LOW
        },
        status: {
            type: Number,
            enum: Object.values(ENUM.WITHDRAW_STATUS),
            default: ENUM.WITHDRAW_STATUS.PENDING
        },
        requestMonth: {
            type: Number
        },
        requestYear: {
            type: Number
        },
        processedAt: {
            type: Date
        }

    },

    { timestamps: true },
);

module.exports = mongoose.model("Withdraw", withdrawSchema);