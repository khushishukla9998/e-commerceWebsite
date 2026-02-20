const mongoose = require("mongoose");
const ENUM = require("../../utils/enum");
const MembershipPlan = require("../../admin/model/memberShipPlanModel")

const userMemberShip = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MembershipPlan",
        required: true,
    },
    stripeCustomerId: {
        type: String,
    },
    stripeSubscriptionId: {
        type: String,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: Number,
        enum: Object.values(ENUM.MEMBERSHIP_STATUS),
        default: ENUM.MEMBERSHIP_STATUS.ACTIVE,
    },
    orderUsedAfterMembership: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model("UserMembership", userMemberShip);
