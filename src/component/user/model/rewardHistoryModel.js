const mongoose = require("mongoose");
const ENUM = require("../../utils/enum");

const rewardHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
    },
    points: {
        type: Number,
        required: true,
    },
    type: {
        type: Number,
        enum: Object.values(ENUM.REWARD_TYPE),
        default: ENUM.REWARD_TYPE.EARNED,
    },
    description: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model("RewardHistory", rewardHistorySchema);
