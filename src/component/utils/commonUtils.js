const multer = require("multer");
const path = require("path");
const fs = require("fs");
const middelwareIndex = require("../../middleware/index");
const User = require("../user/model/userModel");
const Admin = require("../admin/model/adminModel");
const appStrings = require("./appString");

const Promo = require("../admin/model/promoModel");
const UsedPromo = require("../user/model/usedPromo");
const moment = require("moment")

// const crypto = require('crypto');

// const Secret = "user";

// const encrptUserId = (ObjectId) =>{
//   return Buffer
//   .from (ObjectId+Secret).toString("base64")
// };

// const dcryptUserId = (encrptUserId) =>{
//  const decode = Buffer
//   .from (encrptUserId ,"base64").toString("utf8")

//   return decode.replace(Secret)
// };

// function encrypt(text) {
//     const iv = crypto.randomBytes(IV_LENGTH);
//     const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
//     let encrypted = cipher.update(text);
//     encrypted = Buffer.concat([encrypted, cipher.final()]);

//     return iv.toString('hex') + ':' + encrypted.toString('hex');
// }

// function decrypt(text) {
//     const parts = text.split(':');
//     const iv = Buffer.from(parts.shift(), 'hex');
//     const encryptedText = Buffer.from(parts.join(':'), 'hex');
//     const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
//     let decrypted = decipher.update(encryptedText);
//     decrypted = Buffer.concat([decrypted, decipher.final()]);
//     return decrypted.toString();
// }

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
  if (promo.discountType === "flat") {
    const value = Number(promo.discountValue) || 0;
    return Math.min(value, amount);
  }

  if (promo.discountType === "percentage") {
    const percent = Number(promo.discountValue) || 0;
    const discountAmount = (amount * percent) / 100;
    return Math.min(discountAmount, amount);
  }

  return 0;
};

async function applyPromoDiscount(userId, orderAmount, manualCode = null) {
  console.log("applyPromoDiscount input:", { userId, orderAmount, manualCode });

  let totalDiscount = 0;
  const now = new Date();
  const todayStr = moment(now).format("YYYY-MM-DD"); 
  console.log("now",now);
  
  // AUTOMATIC PROMOS
  const automaticPromos = await Promo.find({
    type: "automatic",
    isActive: true,
    startDate: { $lte: todayStr },
    endDate: { $gte: todayStr },
    minOrderAmount: { $lte: orderAmount },
  });
  console.log("automaticPromos count:", automaticPromos.length);

  for (const promo of automaticPromos) {
    const alreadyUsed = await UsedPromo.findOne({
      user: userId,
      promo: promo._id,
    });
    if (alreadyUsed) continue;

    const discount = calculateDiscount(orderAmount, promo);
    if (discount <= 0) continue;

    totalDiscount += discount;

    await UsedPromo.create({
      user: userId,
      promo: promo._id,
    });
  }

  // MANUAL PROMO
  if (manualCode) {
    const pureCode = manualCode.trim().toUpperCase();
    console.log("Looking up manual code:", pureCode);
    console.log("todayStr:", todayStr, "orderAmount:", orderAmount);

    const rawPromo = await Promo.findOne({ code: pureCode });
    console.log("Raw promo (only by code):", rawPromo);

    const manualPromo = await Promo.findOne({
      code: pureCode,
      type: "manual",
      isActive: true,
      startDate: { $lte: todayStr },
      endDate: { $gte: todayStr },
      minOrderAmount: { $lte: orderAmount },
    });

    console.log("Filtered manualPromo:", manualPromo);

    if (!manualPromo) {
      throw new Error("Invalid or ineligible promo code");
    }

    const alreadyUsedManual = await UsedPromo.findOne({
      user: userId,
      promo: manualPromo._id,
    });

    if (alreadyUsedManual) {
      throw new Error("Promo already used");
    }

    const manualDiscount = calculateDiscount(orderAmount, manualPromo);
    console.log("Manual promo discount:", manualDiscount);

    if (manualDiscount <= 0) {
      throw new Error("Promo configuration invalid");
    }

    totalDiscount += manualDiscount;

    await UsedPromo.create({
      user: userId,
      promo: manualPromo._id,
    });
  }

  if (totalDiscount > orderAmount) {
    totalDiscount = orderAmount;
  }

  console.log("Total discount to apply:", totalDiscount);
  return totalDiscount;
}

module.exports = {
  applyPromoDiscount,
  calculateDiscount, 
};

module.exports = {
  routeArray,
  sendSuccessResponse,
  sendErrorResponse,
  storeAcessTokenInCookie,
  storeRefreshTokenInCookie,
  applyPromoDiscount,
};
