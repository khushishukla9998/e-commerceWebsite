/**
 * PROMO CODE CONTROLLER
 * Handles Admin CRUD and logic for promo codes.
 */
const Promo = require("../model/promoModel");
const generatePromoCode = require("../../utils/promoGenerator");
const appStrings = require("../../utils/appString");
const commonUtils = require("../../utils/commonUtils");
const ENUM = require("../../utils/enum");

/**
 * Admin: Create a new Promo Code
 */
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

    // Validation
    const promoTypes = [ENUM.PROMO_TYPE.AUTOMATIC, ENUM.PROMO_TYPE.MANUAL];
    if (!promoTypes.includes(Number(type))) {
      return commonUtils.sendErrorResponse(req, res, appStrings.INVALID_PROMO);
    }

    const discountTypes = [ENUM.DISCOUNT_TYPE.FLAT, ENUM.DISCOUNT_TYPE.PERCENTAGE];
    if (!discountTypes.includes(Number(discountType))) {
      return commonUtils.sendErrorResponse(req, res, appStrings.INVALID_PROMO_DISCOUNT);
    }

    const discountValueNum = Number(discountValue);
    if (isNaN(discountValueNum) || discountValueNum <= 0) {
      return commonUtils.sendErrorResponse(req, res, appStrings.PROMO_INVALID_VALUE);
    }

    if (Number(discountType) === ENUM.DISCOUNT_TYPE.PERCENTAGE && discountValueNum > 100) {
      return commonUtils.sendErrorResponse(req, res, appStrings.PROMO_PERCENT_LIMIT);
    }

    if (Number(type) === ENUM.PROMO_TYPE.AUTOMATIC) {
      if (!startDate || !endDate) {
        return commonUtils.sendErrorResponse(req, res, appStrings.PROMO_DATES_REQUIRED);
      }
      if (new Date(startDate) > new Date(endDate)) {
        return commonUtils.sendErrorResponse(req, res, appStrings.PROMO_INVALID_DATES);
      }
    }

    // Generate unique code if not provided (though system-generated is required)
    const code = await generatePromoCode();

    const promo = await Promo.create({
      code,
      type: Number(type),
      discountType: Number(discountType),
      discountValue: discountValueNum,
      startDate: Number(type) === ENUM.PROMO_TYPE.AUTOMATIC ? startDate : null,
      endDate: Number(type) === ENUM.PROMO_TYPE.AUTOMATIC ? endDate : null,
      minOrderAmount: Number(minOrderAmount) || 0,
    });

    return commonUtils.sendSuccessResponse(req, res, appStrings.PROMO_CREATED, promo);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

/** *==================Update a Promo Code===================== */

const updatePromo = async (req, res) => {
  try {
    const { promoId } = req.params;
    const updateData = req.body;

    // Requirement: Admin cannot update when promo is applied (already used)
    const UsedPromo = require("../../user/model/usedPromo");
    const usageCount = await UsedPromo.countDocuments({ promo: promoId });

    if (usageCount > 0) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.PROMO_CANNOT_MODIFY_USED,
        null,
        400
      );
    }

    const promo = await Promo.findByIdAndUpdate(promoId, updateData, { new: true });
    if (!promo) {
      return commonUtils.sendErrorResponse(req, res, appStrings.PROMO_NOT_FOUND, null, 404);
    }

    return commonUtils.sendSuccessResponse(req, res, appStrings.PROMO_UPDATED, promo);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};


/*    ==================Delete a Promo Code===================== */

const deletePromo = async (req, res) => {
  try {
    const { promoId } = req.params;

  
    const UsedPromo = require("../../user/model/usedPromo");
    const usageCount = await UsedPromo.countDocuments({ promo: promoId });

    if (usageCount > 0) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.PROMO_CANNOT_MODIFY_USED,
        null,
        400
      );
    }

    const promo = await Promo.findByIdAndDelete(promoId);
    if (!promo) {
      return commonUtils.sendErrorResponse(req, res, appStrings.PROMO_NOT_FOUND, null, 404);
    }

    return commonUtils.sendSuccessResponse(req, res, appStrings.PROMO_DELETED);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

/**
 * Admin: List all Promo Codes
 */
const listPromos = async (req, res) => {
  try {
    const promos = await Promo.find().sort({ createdAt: -1 });
    return commonUtils.sendSuccessResponse(req, res, appStrings.PROMO_FETCHED, promos);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

/**
 * Admin: Toggle Promo Status (Enable/Disable)
 */
const togglePromoStatus = async (req, res) => {
  try {
    const { promoId } = req.params;
    const promo = await Promo.findById(promoId);
    if (!promo) {
      return commonUtils.sendErrorResponse(req, res, appStrings.PROMO_NOT_FOUND, null, 404);
    }

    promo.isActive = !promo.isActive;
    await promo.save();

    const message = promo.isActive ? appStrings.PROMO_ENABLED : appStrings.PROMO_DISABLED;
    return commonUtils.sendSuccessResponse(req, res, message, promo);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

module.exports = {
  createPromo,
  updatePromo,
  deletePromo,
  listPromos,
  togglePromoStatus,
};
