const mongoose = require("mongoose");
const ENUM = require("../../utils/enum");

const membership = new mongoose.Schema({
  name: {
    type: Number,
    enum: Object.values(ENUM.MEMBERSHIP_PLAN_NAME),
    required: true,
  },
  durationMonth: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stripeProductId: {
    type: String,
  },
  stripePriceId: {
    type: String,
  },
  discountPercent: {
    type: Number,
    default: 0,
  },
  maxDiscountLimit: {
    type: Number,
    default: 0,
  },
  discountMinOrderAmount: {
    type: Number,
    default: 1000,
  },
  freeDeliveryMinAmount: {
    type: Number,
    default: 2000,
  },
  isFreeDeliveryAll: {
    type: Boolean,
    default: false,
  },
  firstOrderRewardPoints: {
    type: Number,
    default: 0,
  },
  rewardSlab: {
    type: Object, // { "200": 5, "500": 7, "1000": 10, "2000": 20 }
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  minwithdrawPoints: {
    type: Number
  },
  processingFee: {
    type: Number
  },
  maxWithdrawLimit: {
    type: Number
  },
  isfreeWithdraw: {
    type: Boolean,
    default: false
  },


}, { timestamps: true });

module.exports = mongoose.model("MembershipPlan", membership);
