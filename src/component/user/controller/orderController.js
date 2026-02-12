const Order = require("../model/orderModel");
const Cart = require("../model/cartModel");
const Address = require("../model/addressModel");
const Product = require("../../admin/model/productModel");
const config = require("../../../../config/dev.json");
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);
const ENUM = require("../../utils/enum");
const appString = require("../../utils/appString");
const commonUtils = require("../../utils/commonUtils")

//=============palce order ==================
const placeOrder = async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        const { addressId } = req.body;

        // Basic validations
        if (!userId) {
            return commonUtils.sendErrorResponse(req,res,appString.USER_NOT_AUTH,null)
            
        }

        if (!addressId) {
             return commonUtils.sendErrorResponse(req,res,appString.INVALID_ADDRESS_ID,null)
        }

        // Validate Address
        const address = await Address.findOne({ _id: addressId, userId });
        if (!address) {
             return commonUtils.sendErrorResponse(req,res,appString.NOT_A_FOUND,null,409)
        }

        // Get Cart
        const cart = await Cart.findOne({ userId }).populate(
            "items.productId",
            "productName price images"
        );
        if (!cart || !cart.items || cart.items.length === 0) {
             return commonUtils.sendErrorResponse(req,res,appString.EMPTY_CART,null)
        }

        // Prepare Order Items
        const orderItems = [];
        let totalPrice = 0;

        for (const item of cart.items) {
            if (!item.productId) continue; 

            const product = item.productId;

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
            return commonUtils.sendErrorResponse(req,res,appString.NO_VALID_ITEMS,null)
        }

        // Create Order 
        const newOrder = await Order.create({
            userId,
            cartId: cart._id,
            addressId,
            items: orderItems,
            totalPrice,
            status: ENUM.ORDER_STATUS.PENDING,
            paymentStatus: ENUM.PAYMENT_STATUS.PENDING,
            orderDate: new Date(),
        });

        // --- Stripe PaymentIntent using automatic_payment_methods 
            
let paymentIntent;
try {
  paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalPrice * 100), // cents
    currency: "usd",
    description: `Order ${newOrder._id} for ${req.user.email}`,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
  });
} catch (stripeErr) {
  newOrder.status = ENUM.ORDER_STATUS.FAILED;
  newOrder.paymentStatus = ENUM.PAYMENT_STATUS.FAILED;
  await newOrder.save();

  return commonUtils.sendErrorResponse(req,res,appString.stripeErr.message,null)
}

// Save Payment Intent ID to DB
newOrder.stripePaymentIntentId = paymentIntent.id;
await newOrder.save();


        // return res.status(201).json({
        //     success: true,
        //     message: "Order created. Complete payment on client.",
        //     data: {
        //         order: newOrder,
        //         stripePaymentIntentId: paymentIntent.id,
        //         clientSecret: paymentIntent.client_secret,
        //         status: paymentIntent.status,
        //     },
        // });
        return commonUtils.sendSuccessResponse(req,res,appString.ORDER_PLACED_SUCCESS,newOrder)
    } catch (err) {
        console.error("Place Order Error:", err);
       return commonUtils.sendErrorResponse(req,res, err.message,null)
    }
};



//==========cancel order=================//

const cancelOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.body;

        if (!orderId) {
             return commonUtils.sendErrorResponse(req,res,appString.ORDER_ID_REQUIRED,null)
        }

        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
            return commonUtils.sendErrorResponse(req,res,appString.ORDER_NOT_FOUND,null)
        }

                                       
        if ([ENUM.ORDER_STATUS.SHIPED, ENUM.ORDER_STATUS.DELIVERD, ENUM.ORDER_STATUS.CANCELLED].includes(order.status)) {
            return commonUtils.sendErrorResponse(req,res,appString.ORDER_CAN_NOT_CANCLED`${order.status}`,null)
        }

       
        if (order.stripePaymentIntentId) {
            try {
                // Fetch the payment intent to check its status first
                const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

               
                if (![ENUM.ORDER_STATUS.SUCCESS,ENUM.ORDER_STATUS.CANCELLED].includes(paymentIntent.status)) {
                    await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
                    console.log(`Stripe PaymentIntent ${order.stripePaymentIntentId} cancelled.`);
                }
            } catch (stripeErr) {
                console.error("Stripe Cancellation Error:", stripeErr);
               
            }
        }

        order.status = ENUM.ORDER_STATUS.CANCELLED;
        order.paymentStatus = ENUM.PAYMENT_STATUS.CANCELLED;
        await order.save();

         return commonUtils.sendSuccessResponse(req,res,appString.CANCELLED_SUCCESSS,order)

    } catch (err) {
          return commonUtils.sendErrorResponse(req,res,err.message,nu)
    }
};


//
const getInvoice = async (req, res) => {
//     try {
//         let { page = 1, limit = 10 } = req.query;
//         const userId = req.user._id;
//         page = parseInt(page);
//         limit = parseInt(limit);

//         const buildFilter = { userId };

//         // Calculate Total Documents
//         const totalDocs = await Order.countDocuments(buildFilter);

//         // Calculate Grand Total for all matching documents
//         // We use aggregation to sum totalPrice of all matching orders
//         const aggregationResult = await Order.aggregate([
//             { $match: buildFilter },
//             { $group: { _id: null, grandTotal: { $sum: "$totalPrice" } } }
//         ]);
//         const grandTotal = aggregationResult.length > 0 ? aggregationResult[0].grandTotal : 0;

//         // Pagination Logic
//         const skip = (page - 1) * limit;
//         const totalPages = Math.ceil(totalDocs / limit);

//         const orders = await Order.find(buildFilter)
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit)
//             .populate("userId", "name email") // Optionally populate user details
//             .populate("items.productId", "productName price image");

//         return res.status(200).json({
//             success: true,
//             data: orders,
//             pagination: {
//                 totalDocs,
//                 totalPages,
//                 currentPage: page,
//                 limit
//             },
//             grandTotal
//         });

//     } catch (err) {
//         return res.status(500).json({ success: false, error: err.message });
//     }
};



//=================webhook for event handelr =========================

const stripeWebhook = async (req, res) => {
  console.log("webhook hit");
  let event;
try {
   
    if (Buffer.isBuffer(req.body)) {
      const bodyString = req.body.toString("utf8");
      console.log("body as string:", bodyString);
      event = JSON.parse(bodyString);
    } else if (typeof req.body === "string") {
      console.log("body as string:", req.body);
      event = JSON.parse(req.body);
    } else {
      
      event = req.body;
    }
  } catch (parseErr) {
    console.error("Error parsing webhook body:", parseErr);
    return res.status(400).json({ success: false, message: "Invalid JSON" });
  }


  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("payment_intent.succeeded for:", paymentIntent.id);

        const order = await Order.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });
        console.log("order found:", order ? order._id : null);

        if (order && (order.paymentStatus !== ENUM.PAYMENT_STATUS.SUCCESS|| order.status !== ENUM.ORDER_STATUS.SUCCESS)) {
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

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log("payment_intent.payment_failed for:", paymentIntent.id);

        const order = await Order.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });
        console.log("order found:", order ? order._id : null);

        if (order) {
          console.log("before update:", order.paymentStatus, order.status);

          order.paymentStatus = ENUM.ORDER_STATUS.FAILED;
          order.status = ENUM.PAYMENT_STATUS.FAILED;

          await order.save();
          console.log("after update:", order.paymentStatus, order.status);
        }
        break;
      }

    //   case "checkout.session.completed": {
    //     const session = event.data.object;
    //     console.log(
    //       "checkout.session.completed, client_reference_id:",
    //       session.client_reference_id
    //     );

    //     const orderId = session.client_reference_id;
    //     const order = await Order.findById(orderId);
    //     console.log("order found:", order ? order._id : null);

    //     if (order && (order.paymentStatus !== "success" || order.status !== "success")) {
    //       console.log("before update:", order.paymentStatus, order.status);

    //       order.paymentStatus = "success";
    //       order.status = "success";
    //       order.stripePaymentIntentId = session.payment_intent;

    //       await order.save();
    //       console.log("after update:", order.paymentStatus, order.status);

    //       const cart = await Cart.findOne({ userId: order.userId });
    //       console.log("cart found:", !!cart);
    //       if (cart) {
    //         cart.items = [];
    //         cart.totalPrice = 0;
    //         await cart.save();
    //       }
    //     }
    //     break;
    //   }

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
};



//==get  user order details ===============//
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate("items.productId", "productName price images");
const success= ENUM.ORDER_STATUS.SUCCESS
const failed = ENUM.ORDER_STATUS.FAILED
const cancelled = ENUM.ORDER_STATUS.CANCELLED
const pending = ENUM.ORDER_STATUS.PENDING
       
const groupedOrders = {
            success: [ENUM.ORDER_STATUS.SUCCESS],
            failed: [ ENUM.ORDER_STATUS.FAILED],
            cancelled: [ENUM.ORDER_STATUS.CANCELLED],
            pending: [ ENUM.ORDER_STATUS.PENDING]
        };

        orders.forEach(order => {
            if (groupedOrders[order.status]) {
                groupedOrders[order.status].push(order);
            } else {
              
                if (!groupedOrders.pending) groupedOrders.pending = [];
                groupedOrders.pending.push(order);
            }
        });

        return res.status(200).json({
            success: true,
            data: groupedOrders
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    placeOrder,
    cancelOrder,
    getInvoice,
    stripeWebhook,
    getUserOrders
};
