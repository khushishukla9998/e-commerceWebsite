const { default: mongoose } = require("mongoose");
const Cart = require("../model/cartModel");
const Product = require("../../admin/model/productModel");

// ============ Add to Cart ============
const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid Product ID" });
        }

        // Check if product exists and is active (optional constraint)
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        let cart = await Cart.findOne({ userId });

        if (cart) {
            // Cart exists, find if product exists in cart
            const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);

            if (itemIndex > -1) {
                // Product exists in cart, update quantity
                cart.items[itemIndex].quantity += quantity;
            } else {
                // Product does not exist in cart, add new item
                cart.items.push({ productId, quantity });
            }
            await cart.save();
        } else {
            // No cart for user, create new cart
            cart = await Cart.create({
                userId,
                items: [{ productId, quantity }],
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product added to cart",
            data: cart,
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }
};

// ============ Get Cart ============
const getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const cart = await Cart.findOne({ userId }).populate("items.productId", "productName price images");

        if (!cart) {
            return res.status(200).json({
                success: true,
                data: {
                    items: [],
                    totalPrice: 0,
                },
            });
        }

        let totalPrice = 0;
        const items = cart.items.map((item) => {
            const product = item.productId;
            const subTotal = product.price * item.quantity;
            totalPrice += subTotal;
            return {
                productId: product._id,
                productName: product.productName,
                image: product.images[0] || null, // Assuming first image
                price: product.price,
                quantity: item.quantity,
                subTotal: subTotal
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                items,
                totalPrice,
            },
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }
};

// ============ Update Cart Item Quantity ============
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(p => p.productId.toString() == productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            await cart.save();
            return res.status(200).json({ success: true, message: "Cart updated" });
        } else {
            return res.status(404).json({ success: false, message: "Product not found in cart" });
        }

    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
}


// ============ Remove Cart Item ============
const removeCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // Filter out the item to remove
        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        if (cart.items.length === initialLength) {
            return res.status(404).json({ success: false, message: "Product not found in cart" });
        }

        await cart.save();

        return res.status(200).json({ success: true, message: "Item removed from cart" });

    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
}

module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem
};
