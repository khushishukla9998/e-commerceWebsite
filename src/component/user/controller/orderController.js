const Order = require("../model/orderModel");
const Cart = require("../model/cartModel");
const Address = require("../model/addressModel");
const Product = require("../../admin/model/productModel");
const config = require("../../../../config/dev.json");
const stripe = require("stripe")(config.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressId } = req.body;

        if (!addressId) {
            return res.status(400).json({ success: false, message: "Address ID is required" });
        }

        // Validate Address
        const address = await Address.findOne({ _id: addressId, userId });
        if (!address) {
            return res.status(404).json({ success: false, message: "Address not found or does not belong to user" });
        }

        // Get Cart
        const cart = await Cart.findOne({ userId }).populate("items.productId", "productName price images");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        // Prepare Order Items
        const orderItems = [];
        let totalPrice = 0;

        for (const item of cart.items) {
            if (!item.productId) {
                continue; // Skip if product reference is missing
            }

            const product = item.productId; // Populated product

            // Check stock if necessary (optional improvement)

            orderItems.push({
                productId: product._id,
                productName: product.productName,
                image: product.images, // Storing all images or just one as per requirement. Model array implies all.
                price: product.price,
                quantity: item.quantity,
                subTotal: item.subTotal
            });
            totalPrice += item.subTotal;
        }

        // Create Order
        const newOrder = await Order.create({
            userId,
            cartId: cart._id,
            addressId,
            items: orderItems,
            totalPrice: totalPrice, // Use calculated or cart's total
            status: "pending", // Default to pending
            paymentStatus: "pending",
            orderDate: new Date()
        });

        // Create Stripe PaymentIntent
        const { paymentMethodId } = req.body;
        if (!paymentMethodId) {
            return res.status(400).json({ success: false, message: "Payment Method ID is required for backend-only flow" });
        }

        let paymentIntent;
        try {
            paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalPrice * 100),
                currency: "usd",
                payment_method: paymentMethodId,
                confirmation_method: "manual",
                confirm: true,
                description: `Order ${newOrder._id} for ${req.user.email}`,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: "never",
                },
            });
        } catch (stripeErr) {
            newOrder.status = "failed";
            newOrder.paymentStatus = "failed";
            await newOrder.save();
            return res.status(400).json({ success: false, message: "Stripe Payment Error", error: stripeErr.message });
        }

        newOrder.stripePaymentIntentId = paymentIntent.id;

        // Handle immediate payment status and clear cart ONLY on success
        if (paymentIntent.status === "succeeded") {
            newOrder.paymentStatus = "success";
            newOrder.status = "success";

            // Clear Cart only if payment succeeded
            cart.items = [];
            cart.totalPrice = 0;
            await cart.save();
        } else if (paymentIntent.status === "requires_payment_method") {
            newOrder.paymentStatus = "failed";
            newOrder.status = "failed";
        }

        await newOrder.save();

        return res.status(201).json({
            success: true,
            message: paymentIntent.status === "succeeded" ? "Order placed successfully" : "Order placed but payment failed",
            data: {
                order: newOrder,
                stripePaymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                status: paymentIntent.status
            }
        });

    } catch (err) {
        console.error("Place Order Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Check if order can be cancelled (e.g., only 'pending' or 'success' orders)
        // Adjust logic based on business rules. Assuming 'shipped' or 'delivered' cannot be cancelled.
        if (["shipped", "delivered", "cancelled"].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled because it is already ${order.status}`
            });
        }

        // Cancel Stripe PaymentIntent if it exists
        if (order.stripePaymentIntentId) {
            try {
                // Fetch the payment intent to check its status first
                const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

                // Only cancel if it's not already succeeded or cancelled
                if (!["succeeded", "canceled"].includes(paymentIntent.status)) {
                    await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
                    console.log(`Stripe PaymentIntent ${order.stripePaymentIntentId} cancelled.`);
                }
            } catch (stripeErr) {
                console.error("Stripe Cancellation Error:", stripeErr);
                // We continue to cancel the local order even if Stripe fails (e.g., if it's already succeeded according to Stripe)
            }
        }

        order.status = "cancelled";
        order.paymentStatus = "cancelled";
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: order
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

const getInvoice = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        const userId = req.user._id; // Enforce JWT User ID
        page = parseInt(page);
        limit = parseInt(limit);

        const buildFilter = { userId };

        // Calculate Total Documents
        const totalDocs = await Order.countDocuments(buildFilter);

        // Calculate Grand Total for all matching documents
        // We use aggregation to sum totalPrice of all matching orders
        const aggregationResult = await Order.aggregate([
            { $match: buildFilter },
            { $group: { _id: null, grandTotal: { $sum: "$totalPrice" } } }
        ]);
        const grandTotal = aggregationResult.length > 0 ? aggregationResult[0].grandTotal : 0;

        // Pagination Logic
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(totalDocs / limit);

        const orders = await Order.find(buildFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "name email") // Optionally populate user details
            .populate("items.productId", "productName price image");

        return res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                totalDocs,
                totalPages,
                currentPage: page,
                limit
            },
            grandTotal
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    // Testing bypass for Postman (Strictly for development)
    if (process.env.NODE_ENV !== "production" && req.headers["test-webhook"] === "true") {
        event = req.body;
        if (typeof event === "string") event = JSON.parse(event);
    } else {
        try {
            event = stripe.webhooks.constructEvent(
                req.body, // This must be the raw body
                sig,
                config.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error("Webhook Error:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }

    // Handle the event
    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
                if (order && (order.paymentStatus !== "success" || order.status !== "success")) {
                    order.paymentStatus = "success";
                    order.status = "success";
                    await order.save();

                    // Clear user's cart on webhook success
                    const cart = await Cart.findOne({ userId: order.userId });
                    if (cart) {
                        cart.items = [];
                        cart.totalPrice = 0;
                        await cart.save();
                    }
                    console.log(`Order ${order._id} updated and cart cleared via webhook`);
                }
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
                if (order) {
                    order.paymentStatus = "failed";
                    order.status = "failed";
                    await order.save();
                    console.log(`Order ${order._id} updated to failed via webhook`);
                }
                break;
            }

            case "checkout.session.completed": {
                const session = event.data.object;
                const orderId = session.client_reference_id;
                const order = await Order.findById(orderId);
                if (order && (order.paymentStatus !== "success" || order.status !== "success")) {
                    order.paymentStatus = "success";
                    order.status = "success";
                    order.stripePaymentIntentId = session.payment_intent;
                    await order.save();

                    // Clear user's cart on session success
                    const cart = await Cart.findOne({ userId: order.userId });
                    if (cart) {
                        cart.items = [];
                        cart.totalPrice = 0;
                        await cart.save();
                    }
                    console.log(`Order ${orderId} updated and cart cleared via session webhook`);
                }
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (err) {
        console.error("Error processing webhook switch:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error in Webhook" });
    }

    res.json({ received: true });
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate("items.productId", "productName price images");

        const groupedOrders = {
            success: [],
            failed: [],
            cancelled: [],
            pending: []
        };

        orders.forEach(order => {
            if (groupedOrders[order.status]) {
                groupedOrders[order.status].push(order);
            } else {
                // Fallback for any other statuses
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
