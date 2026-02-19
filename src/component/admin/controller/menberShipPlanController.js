const MemberShip = require("../model/memberShipPlanModel");
const commonUtils = require("../../utils/commonUtils");
const appString = require("../../utils/appString");
const config = require("../../../../config/dev.json");
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);

const createMemberShip = async (req, res) => {
  try {
    const {
      name,
      durationMonth,
      price,
      discountPercent,
      maxDiscountLimit,
      freeDeliveryMinAmount,
      isFreeDeliveryall,
      firstOrderRewardPoints,
      rewardSlab,
    } = req.body;
    const existing = await MemberShip.findOne({ name });
    if (existing)
      return commonUtils.sendErrorResponse(
        req,
        res,
        `${name}plan already exist`,
      );

    // crreate  stripe product

    const product = await stripe.products.create({
      name: `${name} MemberShip`,
      description: `${durationMonth} month memberShip plan`,
    });

    //create strip price

    const prices = await stripe.prices.create({
      unit_amount: price * 100,
      recurring: { interval: "month" },
      currency: "inr",
      product: product.id,
    });

    //save in database

    const plan = await MemberShip.create({
      name,
      durationMonth,
      price,
      stripeProductId: product.id,
      stripePriceId: prices.id,
      discountPercent,
      maxDiscountLimit,
      freeDeliveryMinAmount,
      isFreeDeliveryall,
      firstOrderRewardPoints,
      rewardSlab,
    });

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.PLAN_CREATED,
      plan,
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

const updateMmeberShip = async (req, res) => {
  try {
    const plan = await MemberShip.findById(req.params.id);
    if (!plan)
      return commonUtils.sendErrorResponse(req, res, appString.PLAN_NOT_EXIST);

    if (!req.body.price == plan.price) {
      const prices = await stripe.prices.create({
        unit_amount: req.body.price * 100,
        recurring: { interval: "month" },
        currency: "inr",
        product: plan.stripeProductId,
      });

      req.body.stripePriceId = prices.id;
    }
    const update = await MemberShip.findByIdAndUpdate(req.prams.id, req.body, {
      new: true,
    });
    res.json(update);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

module.exports = { createMemberShip, updateMmeberShip };
