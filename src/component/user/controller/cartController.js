const { default: mongoose } = require("mongoose");
const Cart = require("../model/cartModel");
const Product = require("../../admin/model/productModel");
const appString = require("../../utils/appString");
const ENUM = require("../../utils/enum")
// ============ Add to Cart ============

const addToCart = async (req, res) => {
    try {
        const { products, userId: bodyUserId } = req.body;
        const userId = req.user?._id || bodyUserId;

        if (!userId) {
            return commonUtils.sendErrorResponse(req, res, appString.INVALID_USER_ID, null, 400);
        }

        if (!Array.isArray(products) || products.length === 0) {
            return commonUtils.sendErrorResponse(req, res, "Invalid or empty products array", null, 400);
        }

        let cart = await Cart.findOne({ userId });
        let anyItemAlreadyInCart = false;

        if (!cart) {
            cart = await Cart.create({ userId, items: [] });
        }

        for (const item of products) {
            const { productId, quantity = 1 } = item;

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                console.warn(`Invalid Product ID skipped: ${productId}`);
                continue;
            }

            const product = await Product.findById(productId);
            if (!product) {
                console.warn(`Product not found, skipped: ${productId}`);
                continue;
            }

            if (product.status === ENUM.USER_STATUS.INACTIVE) {
                return commonUtils.sendErrorResponse(req, res, appString.PRODUCT_AVAILABLE, null, 400);
            }

            if (product.quantity <= 0 || quantity > product.quantity) {
                return commonUtils.sendErrorResponse(req, res, appString.PRODUCT_OUT_OF_STOCK, null, 400);
            }

            const itemIndex = cart.items.findIndex(
                (cartItem) => cartItem.productId.toString() === productId
            );

            if (itemIndex > -1) {
                anyItemAlreadyInCart = true;
                cart.items[itemIndex].quantity = quantity;
                cart.items[itemIndex].subTotal =
                    cart.items[itemIndex].quantity * product.price;
            } else {
                cart.items.push({

                    productId: product._id,
                    productName: product.productName,
                    image: product.images,
                    price: product.price,
                    quantity,
                    subTotal: quantity * product.price,
                });
            }
        }

        cart.totalPrice = cart.items.reduce((total, item) => total + item.subTotal, 0);

        await cart.save();

        return commonUtils.sendSuccessResponse(req, res, anyItemAlreadyInCart ? appString.ALREADY_IN_CART : "Products added to cart", cart);
    } catch (err) {
        return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
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
                image: product.images[0] || null,
                price: product.price,
                quantity: item.quantity,
                subTotal: subTotal
            }
        });

        return commonUtils.sendSuccessResponse(req, res, appString.FETCH_SUCCESS, {
            items,
            totalPrice,
        });
    } catch (err) {
        return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
    }
};


//update

const updateCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;

        if (!productId || typeof quantity !== 'number') {
            return commonUtils.sendErrorResponse(req, res, "Product ID and quantity are required", null, 400);
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return commonUtils.sendErrorResponse(req, res, "Cart not found", null, 404);
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );

        if (itemIndex > -1) {
            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                cart.items.splice(itemIndex, 1);
            } else {
                // Update quantity and subtotal
                const product = await Product.findById(productId);
                if (!product) {
                    return commonUtils.sendErrorResponse(req, res, appString.NOT_FOUND, null, 404);
                }
                if (product.status === ENUM.USER_STATUS.INACTIVE) {
                    return commonUtils.sendErrorResponse(req, res, appString.PRODUCT_AVAILABLE, null, 400);
                }
                if (quantity > product.quantity) {
                    return commonUtils.sendErrorResponse(req, res, appString.PRODUCT_OUT_OF_STOCK, null, 400);
                }
                cart.items[itemIndex].quantity = quantity;
                cart.items[itemIndex].subTotal = quantity * product.price;
            }

            // Recalculate total price
            cart.totalPrice = cart.items.reduce((total, item) => total + item.subTotal, 0);

            await cart.save();

            return commonUtils.sendSuccessResponse(req, res, "Cart updated successfully", cart);
        } else {
            return commonUtils.sendErrorResponse(req, res, "Item not found in cart", null, 404);
        }
    } catch (err) {
        return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
    }
}

//remove
const removeCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return commonUtils.sendErrorResponse(req, res, "Cart not found", null, 404);
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );

        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
            cart.totalPrice = cart.items.reduce((total, item) => total + item.subTotal, 0);
            await cart.save();
            return commonUtils.sendSuccessResponse(req, res, "Item removed from cart", cart);
        } else {
            return commonUtils.sendErrorResponse(req, res, "Item not found in cart", null, 404);
        }
    } catch (err) {
        return commonUtils.sendErrorResponse(req, res, err.message, null, 500);
    }
}

module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem
};
