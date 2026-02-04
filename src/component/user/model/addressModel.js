const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AddressSchema = new Schema(
  {
    street: {
      type: String,
      required: true, //
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Corrected reference to match User model
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);


AddressSchema.index(
  { userId: 1, isPrimary: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } }
);

module.exports = mongoose.model("Address", AddressSchema);
