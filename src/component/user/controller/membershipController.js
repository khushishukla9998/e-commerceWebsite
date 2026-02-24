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

  const usermemberShip = new UserMembership({userId, planId, stripeCustomerId:custe_id.cust_id});
  await usermemberShip.save();

    console.log("user id::",userId)
    console.log("planid::",planId)

    return commonUtils.sendSuccessResponse(req, res, "Session created", {
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

//Confirm membership after successful Stripe payment.

// const confirmMembership = async (req, res) => {
//   try {
//     const { sessionId } = req.body;
//     const session = await stripe.checkout.sessions.retrieve(sessionId);

//     if (session.payment_status !== "paid") {
//       return commonUtils.sendErrorResponse(req, res, "Payment not successful.");
//     }

//     const { userId, planId } = session.metadata;
//     const plan = await MembershipPlan.findById(planId);

//     const endDate = new Date();
//     endDate.setMonth(endDate.getMonth() + plan.durationMonth);

//     const newMembership = await UserMembership.create({
//       userId,
//       planId,
//       stripeCustomerId: session.customer,
//       stripeSubscriptionId: session.subscription,
//       endDate,
//       status: ENUM.MEMBERSHIP_STATUS.ACTIVE,
//     });

//     return commonUtils.sendSuccessResponse(
//       req,
//       res,
//       "Membership activated successfully!",
//       newMembership,
//     );
//   } catch (err) {
//     return commonUtils.sendErrorResponse(req, res, err.message);
//   }
// };

const confirmMembership = async (req, res) => {
//   try {
//     const { stripeCustomerId, userId, planId } = req.body;

//     if (!stripeCustomerId) {
//       return commonUtils.sendErrorResponse(
//         req,
//         res,
//         "Customer ID is required.",
//       );
//     }

//     //  Retrieve subscriptions for this customer
//     const subscriptions = await stripe.subscriptions.list({
//       customer: stripeCustomerId,
//       status: "active",
//       limit: 1,
//     });

//     if (subscriptions.data.length === 0) {
//       return commonUtils.sendErrorResponse(
//         req,
//         res,
//         "No active subscription found for this customer.",
//       );
//     }

//     const subscription = subscriptions.data[0];

//     const endDate = new Date(subscription.current_period_end * 1000);

//     const newMembership = await UserMembership.create({
//       userId,
//       planId,
//       stripeCustomerId: stripeCustomerId,
//       stripeSubscriptionId: subscription.id,
//       endDate,
//       status: ENUM.MEMBERSHIP_STATUS.ACTIVE,
//     });

//     return commonUtils.sendSuccessResponse(
//       req,
//       res,
//       "Membership activated successfully via Customer ID!",
//       newMembership,
//     );
//   } catch (err) {
//     return commonUtils.sendErrorResponse(req, res, err.message);
//   }
};

module.exports = {
  listPlans,
  purchaseMembership,
  confirmMembership,
};
