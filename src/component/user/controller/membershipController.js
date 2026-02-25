const MembershipPlan = require("../../admin/model/memberShipPlanModel");
const UserMembership = require("../model/userMemberShip");
const commonUtils = require("../../utils/commonUtils");
const appString = require("../../utils/appString");
const config = require("../../../../config/dev.json");
const ENUM = require("../../utils/enum");
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
      appString.ALREADY_ACTIVE
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
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
      status: ENUM.MEMBERSHIP_STATUS.CANCELLED,
    });
    await usermemberShip.save();

    console.log("Membership intent saved:", usermemberShip._id);

    return commonUtils.sendSuccessResponse(req, res, appString.SESSION_CREATED, {
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message);
  }
};

// =============Cancel an active membership subscription.===============================/


const cancelSubscription = async (req, res) => {
  try {
    const userId = req?.user?.id;

    const membership = await UserMembership.findOne({
      userId,
      status: ENUM.MEMBERSHIP_STATUS.ACTIVE,
      stripeSubscriptionId: { $exists: true },
    });

    if (!membership || !membership.stripeSubscriptionId) {
      return commonUtils.sendErrorResponse(
        req,
        res,
      appString.NO_ACTIVE
      );
    }


    if (membership.chargeId) {
      try {
        const refund = await stripe.refunds.create({
          charge: membership.chargeId,
          reason: 'requested_by_customer',
        });
        console.log("Stripe refund successful:", refund.id);
      } catch (refundError) {
      
        console.error("Stripe refund failed:", refundError.message);
    
      }
    }

    const deletedSubscription = await stripe.subscriptions.cancel(
      membership.stripeSubscriptionId,
    );
    console.log("Stripe subscription cancelled:", deletedSubscription.id);



    membership.status = ENUM.MEMBERSHIP_STATUS.CANCELLED;
    membership.paymentStatus = ENUM.PAYMENT_STATUS.REFUNDED;
    await membership.save();

    return commonUtils.sendSuccessResponse(
      req,
      res,
    appString.SUCESS_SUBS_CANCEL,
      { planId: membership.planId },
    );
  } catch (err) {
    console.error("Cancel Subscription Error:", err);
    return commonUtils.sendErrorResponse(req, res, err.message);
  }











  
};



// const cancelSubscriptionWithProration = async (req, res) => {
//   try {
//     const userId = req?.user?.id;
//     const membership = await UserMembership.findOne({
//       userId,
//       status: ENUM.MEMBERSHIP_STATUS.ACTIVE,
//       stripeSubscriptionId: { $exists: true },
//     });

//     if (!membership || !membership.stripeSubscriptionId) {
//       return commonUtils.sendErrorResponse(req, res, appString.NO_ACTIVE);
//     }

   
//     const subscription = await stripe.subscriptions.retrieve(membership.stripeSubscriptionId);
 
//     const currentPeriodEnd = subscription.current_period_end * 1000; // to ms
//     const now = Date.now();
//     const daysRemaining = Math.max(0, Math.ceil((currentPeriodEnd - now) / (1000 * 60 * 60 * 24)));
    

//     const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
//     const totalPaid = invoice.amount_paid; 
//     const totalDays = 30; 
    
//     const refundAmount = Math.floor((totalPaid / totalDays) * daysRemaining);

   
//     if (membership.chargeId && refundAmount > 0) {
//       try {
//         const refund = await stripe.refunds.create({
//           charge: membership.chargeId,
//           amount: refundAmount, 
//           reason: 'requested_by_customer',
//         });
//         console.log("Stripe prorated refund successful:", refund.id);
//       } catch (refundError) {
//         console.error("Stripe refund failed:", refundError.message);
//       }
//     }

//     const deletedSubscription = await stripe.subscriptions.cancel(membership.stripeSubscriptionId);
//     console.log("Stripe subscription cancelled:", deletedSubscription.id);

//     membership.status = ENUM.MEMBERSHIP_STATUS.CANCELLED;
//     membership.paymentStatus = ENUM.PAYMENT_STATUS.REFUNDED;
//     await membership.save();

//     return commonUtils.sendSuccessResponse(req, res, appString.SUCESS_SUBS_CANCEL, { 
//       planId: membership.planId,
//       refundedAmount: refundAmount / 100 
//     });

//   } catch (err) {
//     console.error("Cancel Subscription Error:", err);
//     return commonUtils.sendErrorResponse(req, res, err.message);
//   }
// };


module.exports = {
  listPlans,
  purchaseMembership,
  cancelSubscription,

};
