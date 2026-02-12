const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyparser = require("body-parser");


const path = require("path");
const userIndex = require("./src/component/user/index");
const adminIndex = require("./src/component/admin/index");
// const passwordIndex = require("./src/component/forgot password/index")
const appStrings = require("../e-commerceWebsite/src/component/utils/appString")
const config = require("./config/dev.json")
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);
const ENUM = require("../e-commerceWebsite/src/component/utils/enum")
const commonUtils = require("../e-commerceWebsite/src/component/utils/commonUtils")
const Order = require("../e-commerceWebsite/src/component/user/model/orderModel")
const Cart = require("../e-commerceWebsite/src/component/user/model/cartModel")

const app = express();
const port = 3001;

app.post("/api/webhook",bodyparser.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("hit webhook");

    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        config.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log("webhook signature verification failed", err.message);
      return commonUtils.sendErrorResponse(req, res, err.message, null);
    }

    console.log("stripe event:", event.type);

    try {
      switch (event.type) {
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

            const cart = await Cart.findOne({ userId: order.userId });
            console.log("cart found:", !!cart);
            if (cart) {
              cart.items = [];
              cart.totalPrice = 0;
              await cart.save();
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
            order.paymentStatus = ENUM.PAYMENT_STATUS.CANCELLED || "CANCELLED";
            order.status = ENUM.ORDER_STATUS.CANCELLED || "CANCELLED";
            await order.save();
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
        .json({ success: false, message: "Internal Server Error in Webhook" });
    }

  
    return res.json({ received: true });
  }
);


app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);


console.log("======== SERVER FILE LOADED=========")

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
