const MembershipPlan = require("../../admin/model/memberShipPlanModel");
const UserMembership = require("../model/userMemberShip");
const commonUtils = require("../../utils/commonUtils");
const appString = require("../../utils/appString");
const config = require("../../../../config/dev.json");
const ENUM = require("../../utils/enum");
const { log } = require("console");
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);
const User = require("../../user/model/userModel");

// List all available membership plans for users.

const listPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true });
    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.FETCH_SUCCESS,
      plans,
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

// =========================Create a Stripe Checkout session for membership purchase.
const purchaseMembership = async (req, res) => {
  try {
    const { planId } = req.body;
    console.log(req.body);
    // const userId = req.headers._id;
    const userId = req?.user?.id;
    console.log("hii", req.headers.id);
    console.log("userId", req?.user?.id);

    const custe_id = await User.findById(userId).select("cust_id");
    console.log(custe_id);

    const plan = await MembershipPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return commonUtils.sendErrorResponse(req, res, appString.PLAN_NOT_EXIST);
    }

    // Check if user already has an active membership
    const existing = await UserMembership.findOne({
      userId,
      status: ENUM.MEMBERSHIP_STATUS.ACTIVE,
      endDate: { $gt: new Date() },
    });

    if (existing) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        "You already have an active membership.",
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId, // Use the price ID from the plan model
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `https://${req.headers.origin}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${req.headers.origin}/membership/cancel`,
      customer: custe_id.cust_id || undefined,
    });

    const usermemberShip = new UserMembership({
      userId,
      planId,
      stripeCustomerId: custe_id.cust_id,
      stripeSessionId: session.id, // Save the session ID here
      paymentStatus: ENUM.PAYMENT_STATUS.PENDING,
      status: ENUM.MEMBERSHIP_STATUS.CANCELLED, // Default to inactive/cancelled until paid
    });
    await usermemberShip.save();

    console.log("Membership intent saved:", usermemberShip._id);

    return commonUtils.sendSuccessResponse(req, res, "Session created", {
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

// Cancel an active membership subscription.
const cancelSubscription = async (req, res) => {
  try {
    const userId = req?.user?.id;

    // Find the active membership
    const membership = await UserMembership.findOne({
      userId,
      status: ENUM.MEMBERSHIP_STATUS.ACTIVE,
    });

    if (!membership || !membership.stripeSubscriptionId) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        "No active subscription found to cancel.",
      );
    }

    // Cancel the subscription in Stripe
    const deletedSubscription = await stripe.subscriptions.cancel(
      membership.stripeSubscriptionId,
    );

    console.log("Stripe subscription cancelled:", deletedSubscription.id);

    // Update local database status
    membership.status = ENUM.MEMBERSHIP_STATUS.CANCELLED;
    await membership.save();

    return commonUtils.sendSuccessResponse(
      req,
      res,
      "Subscription cancelled successfully!",
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

const confirmMembership = async (req, res) => {
  // Logic handled via webhook (index.js)
  return commonUtils.sendErrorResponse(req, res, "Manual confirmation is disabled. Use the webhook flow.");
};

module.exports = {
  listPlans,
  purchaseMembership,
  cancelSubscription,
  confirmMembership,
};
