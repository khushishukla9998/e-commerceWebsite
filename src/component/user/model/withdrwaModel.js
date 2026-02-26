// user/model/UsedPromo.js
const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        pointsUsed: {
            type: Number
        },

        remainingPoints:{
            type:Number
        },

        amount: {
            type: Number
        },
        processingFeeAmount: {
            type: Number
        },
        finelAmount: {
            type: Number
        },
        Priority: {
            type: Number,
            enum: [
                ENUM.PRIORITY.LOW,
                ENUM.PRIORITY.MEDIUM,
                ENUM.PRIORITY.HIGH,
            ]
        }
    },
    
    { timestamps: true },
);

module.exports = mongoose.model("Withdraw", withdrawSchema);