const Order = require("../model/orderModel");
const Cart = require("../model/cartModel");
const Address = require("../model/addressModel");
const Product = require("../../admin/model/productModel");
const config = require("../../../../config/dev.json");
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);
const ENUM = require("../../utils/enum");
const appString = require("../../utils/appString");
const commonUtils = require("../../utils/commonUtils");
const Razorpay = require("razorpay");
const Crypto = require("crypto");
const paymentSetting = require("../../admin/model/settingModel");
const razoprpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_SECRETE_KEY,
});

// ============================================================
// PLACE ORDER
// ============================================================

const placeOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { addressId, code } = req.body;

    // 1. Membership Validation
    const memCheck = await commonUtils.checkMembershipRequirement(userId);
    if (!memCheck.allowed) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        memCheck.message,
        null,
        403,
      );
    }

    // Basic validations
    if (!userId) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.USER_NOT_AUTH,
        null,
      );
    }

    if (!addressId) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.INVALID_ADDRESS_ID,
        null,
      );
    }

    // Validate Address
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.NOT_A_FOUND,
        null,
        409,
      );
    }

    let setting = await paymentSetting.findOne();
    if (!setting) {
      setting = { paymentMethod: ENUM.PAYMENT_METHOD.RAZOR_PAY };
    }

    // Get Cart
    const cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "productName price images quantity",
    );
    if (!cart || !cart.items || cart.items.length === 0) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.EMPTY_CART,
        null,
      );
    }

    // Prepare Order Items
    const orderItems = [];
    let totalPrice = 0;

    for (const item of cart.items) {
      if (!item.productId) continue;

      const product = item.productId;

      // Check stock before placing order
      if (product.quantity < item.quantity) {
        return commonUtils.sendErrorResponse(
          req,
          res,
          `${product.productName}: ${appString.PRODUCT_OUT_OF_STOCK}`,
          null,
        );
      }

      orderItems.push({
        productId: product._id,
        productName: product.productName,
        image: product.images,
        price: product.price,
        quantity: item.quantity,
        subTotal: item.subTotal,
      });

      totalPrice += item.subTotal;
    }

    if (orderItems.length === 0) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.NO_VALID_ITEMS,
        null,
      );
    }
    let discount = 0;
    let appliedPromos = [];
    let promoMessages = [];
    try {
      const result = await commonUtils.calculatePromoDiscount(
        userId,
        totalPrice,
        code || null,
      );
      discount = result.totalDiscount;
      appliedPromos = result.appliedPromos;
      promoMessages = result.promoMessages;
    } catch (promoErr) {
      return commonUtils.sendErrorResponse(req, res, promoErr.message, null);
    }

    const payableAmount = Math.max(0, totalPrice - discount);
    const payableAmountBeforeMembership = Math.max(0, totalPrice - discount);

    // 3. Membership Benefit Calculation
    const memBenefits = await commonUtils.getMembershipBenefits(
      userId,
      payableAmountBeforeMembership,
    );

    let finalDiscount = discount + memBenefits.discount;
    let finalPayableAmount = Math.max( 0, payableAmountBeforeMembership - memBenefits.discount);

    // Check delivery fee
    let deliveryFee = memBenefits.freeDelivery ? 0 : 50; // default delivery fee 50 if not free
    finalPayableAmount += deliveryFee;

    // Create Order
    const newOrder = await Order.create({
      userId,
      cartId: cart._id,
      addressId,
      items: orderItems,
      totalPrice,
      discount: finalDiscount,
      finalAmount: finalPayableAmount, // Includes delivery if any
      status: ENUM.ORDER_STATUS.PENDING,
      paymentStatus: ENUM.PAYMENT_STATUS.PENDING,
      orderDate: new Date(),
      appliedPromos: appliedPromos.map((p) => p.id),
      rewardPointsEarned: memBenefits.rewardPoints, // Need to add this field to Order model if we want to track
    });

    // Record usage now that order is created
    await commonUtils.recordPromoUsage(
      userId,
      appliedPromos.map((p) => p.id),
    );

    const paymentMethod = setting.paymentMethod;
    let paymentResponse = null;

    // STRIPE
    if (paymentMethod === ENUM.PAYMENT_METHOD.STRIPE) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(finalPayableAmount * 100),
          currency: "inr",
          description: `Order ${newOrder._id} for ${req.user.email}`,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
        });

        paymentResponse = paymentIntent;
        newOrder.stripePaymentIntentId = paymentIntent.id;

        // update to CONFIRMED after payment confirmation or webhook.
      } catch (stripeErr) {
        newOrder.status = ENUM.ORDER_STATUS.FAILED;
        newOrder.paymentStatus = ENUM.PAYMENT_STATUS.FAILED;
        await newOrder.save();

        return commonUtils.sendErrorResponse(req, res, stripeErr.message, null);
      }
    }

    // RAZORPAY
    else if (paymentMethod === ENUM.PAYMENT_METHOD.RAZOR_PAY) {
      try {
        const razorpayOrder = await razoprpay.orders.create({
          amount: Math.round(finalPayableAmount * 100),
          currency: "INR",
          receipt: `order_${newOrder._id}`,
        });

        newOrder.razorpayOrderId = razorpayOrder.id;
        paymentResponse = razorpayOrder;
        // Still PENDING until payment captured
      } catch (err) {
        newOrder.status = ENUM.ORDER_STATUS.FAILED;
        newOrder.paymentStatus = ENUM.PAYMENT_STATUS.FAILED;
        await newOrder.save();

        return commonUtils.sendErrorResponse(req, res, err.message, null);
      }
    }

    // COD
    else if (paymentMethod === ENUM.PAYMENT_METHOD.COD) {
      newOrder.paymentStatus = ENUM.PAYMENT_STATUS.PENDING;
      newOrder.status = ENUM.ORDER_STATUS.PENDING; //
    }
    await newOrder.save();
    // If COD, we can apply reward points immediately (or wait for delivery)
    if (paymentMethod === ENUM.PAYMENT_METHOD.COD) {
      await commonUtils.applyRewardPoints(
        userId,
        memBenefits.rewardPoints,
        newOrder._id,
        `Earned from Order ${newOrder._id}`,
      );
    }

    // If COD, we can apply reward points immediately (or wait for delivery)
    if (paymentMethod === ENUM.PAYMENT_METHOD.COD) {
      await commonUtils.applyRewardPoints(userId, memBenefits.rewardPoints, newOrder._id, `Earned from Order ${newOrder._id}`);
    }

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.ORDER_PLACED_SUCCESS,
      {
        newOrder,
        paymentResponse,
        paymentMethod,
        discount: finalDiscount,
        payableAmount: finalPayableAmount,
        appliedPromos,
        promoMessages,
        membershipBenefits: {
          bonusPoints: memBenefits.rewardPoints,
          plan: memBenefits.planName,
          freeDelivery: memBenefits.freeDelivery,
        },
      },
    );
  } catch (err) {
    console.error("Place Order Error:", err);
    return commonUtils.sendErrorResponse(req, res, err.message, null);
  }
};

//==========cancel order=================//

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.body;

    if (!orderId) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.ORDER_ID_REQUIRED,
        null,
      );
    }

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.ORDER_NOT_FOUND,
        null,
      );
    }

    if (
      [
        ENUM.ORDER_STATUS.SHIPED,
        ENUM.ORDER_STATUS.DELIVERD,
        ENUM.ORDER_STATUS.CANCELLED,
      ].includes(order.status)
    ) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appString.ORDER_CAN_NOT_CANCLED`${order.status}`,
        null,
      );
    }

    if (order.stripePaymentIntentId) {
      try {
        // Fetch the payment intent to check its status first
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.stripePaymentIntentId,
        );

        if (
          ![ENUM.ORDER_STATUS.SUCCESS, ENUM.ORDER_STATUS.CANCELLED].includes(
            paymentIntent.status,
          )
        ) {
          await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
          console.log(
            `Stripe PaymentIntent ${order.stripePaymentIntentId} cancelled.`,
          );
        }
      } catch (stripeErr) {
        console.error("Stripe Cancellation Error:", stripeErr);
      }
    }

    order.status = ENUM.ORDER_STATUS.CANCELLED;
    order.paymentStatus = ENUM.PAYMENT_STATUS.CANCELLED;
    await order.save();

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.CANCELLED_SUCCESSS,
      order,
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
  }
};

//
const getInvoice = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    page = parseInt(page);
    limit = parseInt(limit);
    const Filter = { userId };
    // Calculate Total Documents
    const totalDocs = await Order.countDocuments(Filter);
    // Calculate Grand Total for all matching documents
    // We use aggregation to sum totalPrice of all matching orders
    const aggregationResult = await Order.aggregate([
      { $match: Filter },
      { $group: { _id: null, grandTotal: { $sum: "$totalPrice" } } },
    ]);
    const grandTotal =
      aggregationResult.length > 0 ? aggregationResult[0].grandTotal : 0;
    // Pagination Logic
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalDocs / limit);
    const orders = await Order.find(Filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email") // Optionally populate user details
      .populate("items.productId", "productName price image");

    return commonUtils.sendSuccessResponse(req, res, appString.FETCH_SUCCESS, {
      orders,
      pagination: {
        totalDocs,
        totalPages,
        currentPage: page,
        limit,
      },
      grandTotal,
    });
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
  }
};

//==get  user order details ===============//
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate("items.productId", "productName price images");

    const groupedOrders = {
      success: [ENUM.ORDER_STATUS.SUCCESS],
      failed: [ENUM.ORDER_STATUS.FAILED],
      cancelled: [ENUM.ORDER_STATUS.CANCELLED],
      pending: [ENUM.ORDER_STATUS.PENDING],
    };

    orders.forEach((order) => {
      if (groupedOrders[order.status]) {
        groupedOrders[order.status].push(order);
      } else {
        if (!groupedOrders.pending) groupedOrders.pending = [];
        groupedOrders.pending.push(order);
      }
    });

    return commonUtils.sendSuccessResponse(
      req,
      res,
      appString.FETCH_SUCCESS,
      groupedOrders,
    );
  } catch (err) {
    return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
  }
};

module.exports = {
  placeOrder,
  cancelOrder,
  getInvoice,
  getUserOrders,
};
