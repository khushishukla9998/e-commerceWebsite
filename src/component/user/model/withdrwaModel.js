// user/model/UsedPromo.js
const mongoose = require("mongoose");
const ENUM = require("../../utils/enum")
const withdrawSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        memnberShipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserMembership"
        },
        planName:{
            type:String,
        },

        pointsUsed: {
            type: Number
        },

        remainingPoints: {
            type: Number
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
        },
         requestMonth:{
            type:Date
        },
        requestYear:{
            type:Date
        },
        
        // isFeeFree:{
        //     type: Boolean,
        //     default: false
        // }
        
    },

    { timestamps: true },
);

module.exports = mongoose.model("Withdraw", withdrawSchema);