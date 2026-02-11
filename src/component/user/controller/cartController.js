const { default: mongoose } = require("mongoose");
const Cart = require("../model/cartModel");
const Product = require("../../admin/model/productModel");

// ============ Add to Cart ============

const addToCart = async (req, res) => {
  try {
    const { products, userId: bodyUserId } = req.body;
    const userId = req.user?._id || bodyUserId; 

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or empty products array" });
    }

    let cart = await Cart.findOne({ userId });

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

      const itemIndex = cart.items.findIndex(
        (cartItem) => cartItem.productId.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
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

    return res.status(200).json({
      success: true,
      message: "Products added to cart",
      data: cart,
    });

  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
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


//update

const updateCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;

        if (!productId || typeof quantity !== 'number') {
            return res.status(400).json({ success: false, message: "Product ID and quantity are required" });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
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
                    return res.status(404).json({ success: false, message: "Product not found" });
                }
                cart.items[itemIndex].quantity = quantity;
                cart.items[itemIndex].subTotal = quantity * product.price;
            }

            // Recalculate total price
            cart.totalPrice = cart.items.reduce((total, item) => total + item.subTotal, 0);

            await cart.save();

            return res.status(200).json({
                success: true,
                message: "Cart updated successfully",
                data: cart,
            });
        } else {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }
    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
}

//remove
const removeCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );

        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
            cart.totalPrice = cart.items.reduce((total, item) => total + item.subTotal, 0);
            await cart.save();
            return res.status(200).json({ success: true, message: "Item removed from cart", data: cart });
        } else {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }
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
