const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyparser = require("body-parser");

const path = require("path");
const userIndex = require("./src/component/user/index");
const adminIndex = require("./src/component/admin/index");
// const passwordIndex = require("./src/component/forgot password/index")
const appStrings = require("./src/component/utils/appString");
const config = require("./config/dev.json");
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);
const ENUM = require("./src/component/utils/enum");
const commonUtils = require("./src/component/utils/commonUtils");
const Order = require("./src/component/user/model/orderModel");
const Cart = require("./src/component/user/model/cartModel");
const crypto = require("crypto");
const Product = require("./src/component/admin/model/productModel");
const UserMembership = require("./src/component/user/model/userMemberShip");
const MembershipPlan = require("./src/component/admin/model/memberShipPlanModel");
const User = require("./src/component/user/model/userModel");

const app = express();
const port = 3001;

// razorapay webhook===================

app.post(
  "/api/razorpay-webhook",
  bodyparser.raw({ type: "application/json" }),

  async (req, res) => {
    console.log("hit-- RazorPay-- webhook");
    const webhookSecrete = config.RAZORPAY_WEBHOOK_SECRET;

    const signature = req.headers["x-razorpay-signature"];
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecrete)
      .update(req.body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.log("invalid RazorPay signature");
      return commonUtils.sendErrorResponse(req, res, "invalid,signature");
    }

    const event = JSON.parse(req.body.toString());
    console.log("RazorPay Event", event.event);

    try {
      switch (event.event) {
        case "payment.captured": {
          const payment = event.payload.payment.entity;
          const order = await Order.findOne({
            razorpayOrderId: payment.order_id,
          });

          if (order) {
            order.paymentStatus = ENUM.PAYMENT_STATUS.SUCCESS;
            order.status = ENUM.ORDER_STATUS.SUCCESS;
            order.razorpayPayementId = payment.id;

            await order.save();

            console.log("order success", order._id);

            // stock reduce
            for (const item of order.items) {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { quantity: -item.quantity },
              });
            }

            const cart = await Cart.findOne({ userId: order.userId });
            if (cart) {
              cart.items = [];
              cart.totalPrice = 0;
              await cart.save();
            }

            // APPLY REWARD POINTS
            if (order.rewardPointsEarned > 0) {
              await commonUtils.applyRewardPoints(order.userId, order.rewardPointsEarned, order._id, `Earned from order ${order._id}`);
            }
          }
          break;
        }
        case "payment.failed": {
          const payment = event.payload.payment.entity;
          const order = await Order.findOne({ razorpayOrderId: payment.order_id });
          console.log("order", order)
          if (order) {
            order.paymentStatus = ENUM.PAYMENT_STATUS.FAILED
            order.status = ENUM.ORDER_STATUS.FAILED
            await order.save();

            console.log("order failed", order._id);
          }
          break;
        }
        default:
          console.log("unhandle razorpay event:", event.event);
      }
    } catch (err) {
      console.error("razorpay Webhook erroe", err.message);
    }

    res.json({ status: "ok" });
  },
);

//==========stripe webhook=====================/.

app.post(
  "/api/webhook",
  bodyparser.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("hit ---Stripe--- webhook");

    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        config.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.log("webhook signature verification failed", err.message);
      return commonUtils.sendErrorResponse(req, res, err.message, null);
    }

    console.log("stripe event:", event.type);

    try {
      switch (event.type) {
        // 0. Checkout Session Completed (for Membership)
        case "checkout.session.completed": {
          const session = event.data.object;
          console.log("checkout.session.completed for:", session.id);

          // Find the membership record using the session ID
          const membership = await UserMembership.findOne({
            stripeSessionId: session.id,
          });

          if (membership) {
            const plan = await MembershipPlan.findById(membership.planId);

            if (plan) {
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() + plan.durationMonth);

              membership.stripeCustomerId = session.customer;
              membership.stripeSubscriptionId = session.subscription;
              membership.endDate = endDate;
              membership.paymentStatus = ENUM.PAYMENT_STATUS.SUCCESS;
              membership.status = ENUM.MEMBERSHIP_STATUS.ACTIVE;

              await membership.save();
              console.log(
                `Membership activated for user ${membership.userId} via webhook using session ID.`,
              );
            } else {
              console.error("Membership plan not found for ID:", membership.planId);
            }
          } else {
            console.log("No membership record found for session ID:", session.id);
          }
          break;
        }

        // 1. PaymentIntent created
        case "payment_intent.created": {
          const paymentIntent = event.data.object;
          console.log("payment_intent.created for:", paymentIntent.id);

          const order = await Order.findOne({
            stripePaymentIntentId: paymentIntent.id,
          });
          console.log("order found:", order ? order._id : null);

          if (order) {
            console.log("before update:", order.paymentStatus, order.status);

            order.paymentStatus = ENUM.PAYMENT_STATUS.PENDING;
            order.status = ENUM.ORDER_STATUS.PENDING;

            await order.save();
            console.log("after update:", order.paymentStatus, order.status);
          }
          break;
        }

        case "payment_intent.requires_action":
        case "payment_intent.processing": {
          const paymentIntent = event.data.object;
          console.log(`${event.type} for:`, paymentIntent.id);

          const order = await Order.findOne({
            stripePaymentIntentId: paymentIntent.id,
          });
          console.log("order found:", order ? order._id : null);

          if (order) {
            order.paymentStatus = ENUM.PAYMENT_STATUS.PENDING;
            order.status = ENUM.ORDER_STATUS.PENDING;
            await order.save();
          }
          break;
        }

        // 3. Payment succeeded
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object;
          console.log("payment_intent.succeeded for:", paymentIntent.id);

          const order = await Order.findOne({
            stripePaymentIntentId: paymentIntent.id,
          });
          console.log("order found:", order ? order._id : null);

          if (
            order &&
            (order.paymentStatus !== ENUM.PAYMENT_STATUS.SUCCESS ||
              order.status !== ENUM.ORDER_STATUS.SUCCESS)
          ) {
            console.log("before update:", order.paymentStatus, order.status);

            order.paymentStatus = ENUM.PAYMENT_STATUS.SUCCESS;
            order.status = ENUM.ORDER_STATUS.SUCCESS;

            await order.save();
            console.log("after update:", order.paymentStatus, order.status);

            // Decrement stock for each item in the order
            const Product = require("./src/component/admin/model/productModel");
            for (const item of order.items) {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { quantity: -item.quantity },
              });
              console.log(
                `Stock decremented for product: ${item.productId} by ${item.quantity}`,
              );
            }

            const cart = await Cart.findOne({ userId: order.userId });
            console.log("cart found:", !!cart);
            if (cart) {
              cart.items = [];
              cart.totalPrice = 0;
              await cart.save();
            }

            // APPLY REWARD POINTS
            if (order.rewardPointsEarned > 0) {
              await commonUtils.applyRewardPoints(order.userId, order.rewardPointsEarned, order._id, `Earned from order ${order._id}`);
            }
          }
          break;
        }

        // 4. Payment failed
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          console.log("payment_intent.payment_failed for:", paymentIntent.id);

          const order = await Order.findOne({
            stripePaymentIntentId: paymentIntent.id,
          });
          console.log("order found:", order ? order._id : null);

          if (order) {
            console.log("before update:", order.paymentStatus, order.status);

            order.paymentStatus = ENUM.PAYMENT_STATUS.FAILED;
            order.status = ENUM.ORDER_STATUS.FAILED;

            await order.save();
            console.log("after update:", order.paymentStatus, order.status);
          }
          break;
        }

        // 5. Canceled
        case "payment_intent.canceled": {
          const paymentIntent = event.data.object;
          console.log("payment_intent.canceled for:", paymentIntent.id);

          const order = await Order.findOne({
            stripePaymentIntentId: paymentIntent.id,
          });
          console.log("order found:", order ? order._id : null);

          if (order) {
            order.paymentStatus =
              ENUM.PAYMENT_STATUS.CANCELLED || "CANCELLED";
            order.status = ENUM.ORDER_STATUS.CANCELLED || "CANCELLED";
            await order.save();
          }
          break;
        }

        // 6. Subscription Deleted (Canceled)
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          console.log("customer.subscription.deleted for:", subscription.id);

          const membership = await UserMembership.findOne({
            stripeSubscriptionId: subscription.id,
          });

          if (membership) {
            membership.status = ENUM.MEMBERSHIP_STATUS.CANCELLED;
            await membership.save();
            console.log(`Membership cancelled for user ${membership.userId} via webhook.`);
          }
          break;
        }

        // 7. Charge Refunded
        case "charge.refunded": {
          const charge = event.data.object;
          console.log("charge.refunded for:", charge.id);

          // Find membership by customer ID
          const membership = await UserMembership.findOne({
            stripeCustomerId: charge.customer,
            status: ENUM.MEMBERSHIP_STATUS.ACTIVE,
          });

          if (membership) {
            membership.paymentStatus = ENUM.PAYMENT_STATUS.REFUNDED;
            membership.status = ENUM.MEMBERSHIP_STATUS.CANCELLED;
            await membership.save();
            console.log(`Membership refunded and cancelled for user ${membership.userId} via webhook.`);
          }
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (err) {
      console.error("Error processing webhook:", err);
      return res
        .status(500)
        .json({
          success: false,
          message: "Internal Server Error in Webhook",
        });
    }

    return res.json({ received: true });
  },
);


app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

console.log("======== SERVER FILE LOADED=========");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  next();
});

app.use("/api", userIndex);
app.use("/api/admin", adminIndex);
// app.use("/api/password",passwordIndex)

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//================databse connection=====================================

const connectDb = async () => {
  try {
    await mongoose.connect(config.MONGO_DB_URL);
    console.log(appStrings.DATABASE_CONNECT);
  } catch (err) {
    console.log(err.message);
  }
};

// port declartion

async function startServer() {
  try {
    app.listen(port, () => {
      console.log(appStrings.SERVER_RUNNING + ` ${port}`);
    });
  } catch (err) {
    console.log(err.message, appStrings.SERVER_ERROR);
  }
}

startServer();
connectDb();
