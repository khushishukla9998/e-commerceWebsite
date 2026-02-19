const multer = require("multer");
const path = require("path");
const fs = require("fs");
const middelwareIndex = require("../../middleware/index");
const User = require("../user/model/userModel");
const Admin = require("../admin/model/adminModel");
const appStrings = require("./appString");

const Promo = require("../admin/model/promoModel");
const UsedPromo = require("../user/model/usedPromo");
const moment = require("moment");
const ENUM = require("./enum");

// ============================================================
// RESPONSE UTILITIES
// ============================================================

//===================successResponse===========================
function sendSuccessResponse(req, res, message, data = null, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

//=====================errorResopnse=====================

function sendErrorResponse(req, res, message, data = null, status = 422) {
  return res.status(status).json({
    success: false,
    message,
    data,
  });
}

// Set access token cookie
function storeAcessTokenInCookie(res, name, tokenValue) {
  res.cookie(name, tokenValue, {
    httpOnly: true,
    sameSite: "lax",
  });
}

// Set refresh token cookie
function storeRefreshTokenInCookie(res, name, tokenValue) {
  res.cookie(name, tokenValue, {
    httpOnly: true,
    sameSite: "lax",
  });
}

//========================route handler=====================================
const routeArray = (array_, prefix, isAdmin = false) => {
  array_.forEach((route) => {
    const method = route.method;
    const path = route.path;
    const controller = route.controller;
    const validation = route.validation;
    // const isAdmin = route.isAdmin;
    // const isUser = route.isUser;

    let middlewares = [];

    const isPublic = route.isPublic === undefined ? false : route.isPublic;
    // const isAdmin = route.isAdmin === undefined ? false : route.isAdmin;
    //const isUser = route.isUser === undefined ? false : route.isUser;
    // Middleware to log the request IP and userId

    if (!isPublic) {
      middlewares.push(middelwareIndex.verifyAcessToken);
      if (isAdmin) {
        middlewares.push(checkAdmin);
      } else {
        middlewares.push(checkUser);
      }
    }

    if (validation) {
      if (Array.isArray(validation)) {
        middlewares.push(...validation);
      } else {
        middlewares.push(validation);
      }
    }
    middlewares.push(controller);
    prefix[method](path, ...middlewares);
  });

  return prefix;
};

const checkAdmin = async (req, res, next) => {
  const id = req.userId;

  const user = await User.findById(id);
  if (user) {
    return res.status(400).json({
      success: false,
      message: appStrings.USER_NOT_AUTHORIZED,
    });
  }
  const admin = await Admin.findById(id);
  if (!admin) {
    return res.status(400).json({
      success: false,
      message: appStrings.USER_NOT_AUTHORIZED,
    });
  }
  req.admin = admin;
  next();
};
const checkUser = async (req, res, next) => {
  const id = req.userId;
  const admin = await Admin.findById(id);
  if (admin) {
    return res.status(400).json({
      success: false,
      message: appStrings.ADMIN_NOT_AUTHORIZED,
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: appStrings.ADMIN_NOT_AUTHORIZED,
    });
  }
  req.user = user;
  next();
};




// ==================== PROMO DISCOUNT LOGIC ===================

const calculateDiscount = (amount, promo) => {
  if (promo.discountType === ENUM.DISCOUNT_TYPE.FLAT) {
    const value = Number(promo.discountValue) || 0;
    return Math.min(value, amount);
  }

  if (promo.discountType === ENUM.DISCOUNT_TYPE.PERCENTAGE) {
    const percent = Number(promo.discountValue) || 0;
    const discountAmount = (amount * percent) / 100;
    return Math.min(discountAmount, amount);
  }

  return 0;
};


async function calculatePromoDiscount(userId, orderAmount, manualCode = null) {
  let currentOrderAmount = orderAmount;
  const appliedPromos = [];
  const promoMessages = [];
  const now = new Date();
  const todayStr = moment(now).format("YYYY-MM-DD");

  // 1. AUTOMATIC PROMOS
  const automaticPromos = await Promo.find({
    type: ENUM.PROMO_TYPE.AUTOMATIC,
    isActive: true,
  });

  for (const promo of automaticPromos) {
    const startDateStr = moment(promo.startDate).format("YYYY-MM-DD");
    const endDateStr = moment(promo.endDate).format("YYYY-MM-DD");

    if (todayStr < startDateStr || todayStr > endDateStr) {
      continue;
    }

    if (orderAmount < promo.minOrderAmount) {
      promoMessages.push(`Automatic promo ${promo.code} failed: ${appStrings.PROMO_MIN_AMOUNT_NOT_MET} (${promo.minOrderAmount})`);
      continue;
    }

    const alreadyUsed = await UsedPromo.findOne({
      user: userId,
      promo: promo._id,
    });
    if (alreadyUsed) {
      promoMessages.push(`Automatic promo ${promo.code} failed: ${appStrings.PROMO_ALREADY_USED_AUTO}`);
      continue;
    }

    const discount = calculateDiscount(currentOrderAmount, promo);
    if (discount <= 0) continue;

    currentOrderAmount -= discount;
    appliedPromos.push({
      id: promo._id,
      code: promo.code,
      type: promo.type,
      discount: discount
    });
  }

  // 2. MANUAL PROMO
  if (manualCode) {
    const pureCode = manualCode.trim().toUpperCase();

    // Manual is NOT date-based 
    const manualPromo = await Promo.findOne({
      code: pureCode,
      type: ENUM.PROMO_TYPE.MANUAL,
      isActive: true,
    });

    if (!manualPromo) {
      throw new Error(appStrings.INVALID_PROMO_CODE);
    }

    if (orderAmount < manualPromo.minOrderAmount) {
      throw new Error(`${appStrings.PROMO_MIN_AMOUNT_NOT_MET}: ${manualPromo.minOrderAmount}`);
    }

    const alreadyUsedManual = await UsedPromo.findOne({
      user: userId,
      promo: manualPromo._id,
    });

    if (alreadyUsedManual) {
      throw new Error(appStrings.PROMO_ALREADY_USED);
    }

    const manualDiscount = calculateDiscount(currentOrderAmount, manualPromo);

    if (manualDiscount > 0) {
      currentOrderAmount -= manualDiscount;
      appliedPromos.push({
        id: manualPromo._id,
        code: manualPromo.code,
        type: manualPromo.type,
        discount: manualDiscount
      });
    }
  }

  const totalDiscount = orderAmount - currentOrderAmount;

  return { totalDiscount, appliedPromos, promoMessages };
}

/**
 * Records that the promos have been used by the user.
 */
async function recordPromoUsage(userId, promoIds) {
  if (!promoIds || promoIds.length === 0) return;

  const usageRecords = promoIds.map(promoId => ({
    user: userId,
    promo: promoId
  }));

  try {
    await UsedPromo.insertMany(usageRecords, { ordered: false });
  } catch (err) {
    console.error("Error recording promo usage:", err);
  
  }
}

module.exports = {
  routeArray,
  sendSuccessResponse,
  sendErrorResponse,
  storeAcessTokenInCookie,
  storeRefreshTokenInCookie,
  calculatePromoDiscount,
  recordPromoUsage,
};
