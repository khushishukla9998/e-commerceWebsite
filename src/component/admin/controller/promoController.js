const Promo = require("../model/promoModel");
const generatePromoCode = require("../../utils/promoGenerator");
const appStrings = require("../../utils/appString");
const commonUtils = require("../../utils/commonUtils");

const createPromo = async (req, res) => {
  try {
    let {
      type,
      discountType,
      discountValue,
      minOrderAmount,
      startDate,
      endDate,
    } = req.body;

    // Clean up strings
    if (typeof type === "string") type = type.trim();
    if (typeof discountType === "string") discountType = discountType.trim();

    const discountValueNum = Number(discountValue);
    const minOrderAmountNum = Number(minOrderAmount);

    if (!["automatic", "manual"].includes(type)) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.INVALID_PROMO,
        null
      );
    }

    if (!["flat", "percentage"].includes(discountType)) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.INVALID_PROMO_DISCOUNT,
        null
      );
    }

    if (discountType === "percentage" && discountValueNum > 100) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.EXCEED,
        null
      );
    }

    if (type === "automatic" && (!startDate || !endDate)) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.DATE_REQUUIRED,
        null
      );
    }

    const code = await generatePromoCode();

    const promo = await Promo.create({
      code,
      type,
      discountType,
      discountValue: discountValueNum,
      startDate,
      endDate,
      minOrderAmount: minOrderAmountNum,
    });

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appStrings.PROMO_CREATES,
      promo
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

module.exports = { createPromo };