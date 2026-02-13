
const mongoose = require("mongoose");

const ENUM = require("../../utils/enum")
const settingSchema = mongoose.Schema({

    paymentMethod:{
        type:Number,
        enum:[ENUM.PAYMENT_METHOD.COD,ENUM.PAYMENT_METHOD.RAZOR_PAY,ENUM.PAYMENT_METHOD.STRIPE],
        default:ENUM.PAYMENT_METHOD.RAZOR_PAY
    }


});

module.exports = mongoose.model("Setting", settingSchema);;





