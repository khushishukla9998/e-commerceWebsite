const mongoose = require("mongoose");

const membership = new mongoose.Schema({
  name: {
    type: String,
    enum: ["silver", "gold", "platinum"],
  },
  durationMonth: {
    type: Number,
  },
  price: {
    type: Number,
  },
  discountPercent: {
    type: Number,
  },
  maxDiscountLimit: {
    type: Number,
  },
  discpountMinOrderAmolunt: {
    type: Number,
  },
  freeDeliveryMinAmount: {
    type: Number,
  },
  isFreeDeliveryall: {
    type: Boolean,
  },

  firstOrderRewardPoints: {
    type: Number,
  },

  rewardSlab: 
    {
     type:Object,
    },
  
  isactive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("MembershipPlan", membership);
