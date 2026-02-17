// admin/model/Promo.js
const mongoose = require("mongoose");
const moment = require("moment");
const ENUM = require("../../utils/enum");

const promoSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, unique: true },
    type: {
      type: Number,
      enum: [ENUM.PROMO_TYPE.AUTOMATIC, ENUM.PROMO_TYPE.MANUAL],
      required: true
    },
    discountType: {
      type: Number,
      enum: [ENUM.DISCOUNT_TYPE.FLAT, ENUM.DISCOUNT_TYPE.PERCENTAGE],
      required: true,
    },
    discountValue: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    startDate: {
      type: Date,

      default: moment().format("YYYY-MM-DD"),
    },
    endDate: {
      type: Date,

      default: moment().format("YYYY-MM-DD"),
    },
    isActive: { type: Boolean, default: true },
  },

);

module.exports = mongoose.model("Promo", promoSchema);
