const MembershipPlan = require("../../admin/model/memberShipPlanModel");
const UserMembership = require("../model/userMemberShip");
const commonUtils = require("../../utils/commonUtils");
const appString = require("../../utils/appString");
const config = require("../../../../config/dev.json");
const ENUM = require("../../utils/enum");
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);

/**
 * List all available membership plans for users.
 */
const listPlans = async (req, res) => {
    try {
        const plans = await MembershipPlan.find({ isActive: true });
        return commonUtils.sendSuccessResponse(req, res, appString.FETCH_SUCCESS, plans);
    } catch (err) {
        return commonUtils.sendErrorResponse(req, res, err.message);
    }
};

/**
 * Create a Stripe Checkout session for membership purchase.
 */
const purchaseMembership = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user._id;

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
            return commonUtils.sendErrorResponse(req, res, "You already have an active membership.");
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
            success_url: `${req.headers.origin}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/membership/cancel`,
            metadata: {
                userId: userId.toString(),
                planId: planId.toString(),
            },
        });

        return commonUtils.sendSuccessResponse(req, res, "Session created", { sessionId: session.id, url: session.url });
    } catch (err) {
        return commonUtils.sendErrorResponse(req, res, err.message);
    }
};

/**
 * Confirm membership after successful Stripe payment.
 */
const confirmMembership = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            return commonUtils.sendErrorResponse(req, res, "Payment not successful.");
        }

        const { userId, planId } = session.metadata;
        const plan = await MembershipPlan.findById(planId);

        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + plan.durationMonth);

        const newMembership = await UserMembership.create({
            userId,
            planId,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            endDate,
            status: ENUM.MEMBERSHIP_STATUS.ACTIVE,
        });

        return commonUtils.sendSuccessResponse(req, res, "Membership activated successfully!", newMembership);
    } catch (err) {
        return commonUtils.sendErrorResponse(req, res, err.message);
    }
};

module.exports = {
    listPlans,
    purchaseMembership,
    confirmMembership,
};
