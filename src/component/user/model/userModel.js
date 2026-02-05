const mongoose = require("mongoose");
const Address = require("./addressModel")

const ENUM = require("../../utils/enum")
const userSchema = mongoose.Schema({

    name: {
        type: String,
        required: true,

    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    profileImage: {
        type: String,
    },
    status: {
        type: String,
        default: ENUM.USER_STATUS.ACTIVE
    },
    isDeleted: {
        type: Number,
        default: ENUM.DELETE_STATUS.NOT_DELETE
    },


});

const User = mongoose.model("User", userSchema);
module.exports = User;




