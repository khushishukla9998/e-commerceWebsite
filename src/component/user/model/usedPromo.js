// user/model/UsedPromo.js
const mongoose = require("mongoose");

const usedPromoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    promo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promo",
      required: true,
    },
  },
  { timestamps: true },
);

usedPromoSchema.index({ user: 1, promo: 1 }, { unique: true });

module.exports = mongoose.model("UsedPromo", usedPromoSchema);