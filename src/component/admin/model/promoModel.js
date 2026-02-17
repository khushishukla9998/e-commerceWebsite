// admin/model/Promo.js
const mongoose = require("mongoose");
const moment = require("moment");

const promoSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, unique: true },
    type: { type: String, enum: ["automatic", "manual"], required: true },
    discountType: {
      type: String,
      enum: ["flat", "percentage"],
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
