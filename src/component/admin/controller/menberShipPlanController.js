const MemberShip = require("../model/memberShipPlanModel");
const commonUtils = require("../../utils/commonUtils");
const appString = require("../../utils/appString");
const config = require("../../../../config/dev.json");
const ENUM = require("../../utils/enum");
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);

const planNames = {
  [ENUM.MEMBERSHIP_PLAN_NAME.SILVER]: "Silver",
  [ENUM.MEMBERSHIP_PLAN_NAME.GOLD]: "Gold",
  [ENUM.MEMBERSHIP_PLAN_NAME.PLATINUM]: "Platinum",
};

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
        `${planNames[name] || name} plan already exist`,
      );

    // crreate  stripe product
    const product = await stripe.products.create({
      name: `${planNames[name] || name} MemberShip`,
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

    let { minwithdrawPoints, processingFee, maxWithdrawLimit, isfreeWithdraw } = req.body;
    if (!req.body.price == plan.price) {
      const prices = await stripe.prices.create({
        unit_amount: req.body.price * 100,
        recurring: { interval: "month" },
        currency: "inr",
        product: plan.stripeProductId,
      });

      req.body.stripePriceId = prices.id;
    }

    const updateData = {};
    if (minwithdrawPoints !== undefined) updateData.minwithdrawPoints = minwithdrawPoints;
    if (processingFee !== undefined) updateData.processingFee = processingFee;
    if (maxWithdrawLimit !== undefined) updateData.maxWithdrawLimit = maxWithdrawLimit;
    if (isfreeWithdraw !== undefined) updateData.isfreeWithdraw = isfreeWithdraw;

    const update = await MemberShip.findByIdAndUpdate(req.params.id, req.body, updateData, {
      new: true,
    });


    // const update = await MemberShip.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    // });
    return commonUtils.sendSuccessResponse(req, res, appString.PR_UPDATE_SUCCESS, update);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

const togglePlanStatus = async (req, res) => {
  try {
    const plan = await MemberShip.findById(req.params.id);
    if (!plan) return commonUtils.sendErrorResponse(req, res, appString.PLAN_NOT_EXIST);

    plan.isActive = !plan.isActive;
    await plan.save();

    return commonUtils.sendSuccessResponse(req, res, plan.isActive ? appString.PLAN_ENABLED : appString.PLAN_DISABLED, plan);
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

module.exports = { createMemberShip, updateMmeberShip, togglePlanStatus };
