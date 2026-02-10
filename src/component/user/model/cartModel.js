
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    image: [String],
    price: Number,
    quantity: Number,
    subTotal: Number,
    totalPrice :Number
  }],
  totalPrice: Number,
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
