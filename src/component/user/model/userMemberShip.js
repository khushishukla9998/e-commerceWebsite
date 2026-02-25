const mongoose = require("mongoose");
const ENUM = require("../../utils/enum");
const MembershipPlan = require("../../admin/model/memberShipPlanModel");

const userMemberShip = new mongoose.Schema(
  {
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
    stripeSessionId: {
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
      //required: true,
    },
    status: {
      type: Number,

      enum: [
        ENUM.MEMBERSHIP_STATUS.ACTIVE,
        ENUM.MEMBERSHIP_STATUS.CANCELLED,
        ENUM.MEMBERSHIP_STATUS.EXPIRED,
      ],
      default: ENUM.MEMBERSHIP_STATUS.ACTIVE,
    },
    paymentStatus: {
      type: Number,
      enum: [
        ENUM.PAYMENT_STATUS.PENDING,
        ENUM.PAYMENT_STATUS.SUCCESS,
        ENUM.PAYMENT_STATUS.FAILED,
        ENUM.PAYMENT_STATUS.CANCELLED,
        ENUM.PAYMENT_STATUS.REFUNDED
      ],
      default: ENUM.PAYMENT_STATUS.PENDING,
    },
    orderUsedAfterMembership: {
      type: Number,
      default: 0,
    },
    chargeId:{
      type:String,
     //efault:null
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserMembership", userMemberShip);
