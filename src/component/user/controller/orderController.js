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
            status: "success", // Default as per request
            paymentStatus: "pending",
            orderDate: new Date()
        });

        // Create Stripe Checkout Session
        const lineItems = orderItems.map(item => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.productName,
                    images: item.image && item.image.length > 0 ? [item.image[0]] : [],
                },
                unit_amount: Math.round(item.price * 100), // Stripe expects amount in cents
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${config.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.CLIENT_URL}/cancel`,
            client_reference_id: newOrder._id.toString(),
            customer_email: req.user.email,
        });

        newOrder.stripeSessionId = session.id;
        await newOrder.save();

        // Clear Cart
        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: {
                order: newOrder,
                stripeUrl: session.url
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

        order.status = "cancelled";
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
        let { page = 1, limit = 10, userId } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const buildFilter = {};
        if (userId) {
            buildFilter.userId = userId;
        }

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

    // Handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Update Order status
        const orderId = session.client_reference_id;
        try {
            const order = await Order.findById(orderId);
            if (order) {
                order.paymentStatus = "paid";
                order.stripePaymentIntentId = session.payment_intent;
                await order.save();
                console.log(`Order ${orderId} updated to paid`);
            }
        } catch (err) {
            console.error("Error updating order in webhook:", err);
        }
    }

    res.json({ received: true });
};

module.exports = {
    placeOrder,
    cancelOrder,
    getInvoice,
    stripeWebhook
};
