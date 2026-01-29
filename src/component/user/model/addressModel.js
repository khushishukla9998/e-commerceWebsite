const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require("./userModel")

const AddressSchema = new Schema({
    street: {
        type: String,
        // required: true
    },
    city: {
        type: String,
        // required: true
    },
    state: {
        type: String,
        // required: true
    },
    zipCode: {
        type: String,
    //     required: true
     },
    isPrimary: {
        type: Boolean,
        default: false
    },
    // Reference back to the User model using the user's ID
    userId:{
        type: Schema.Types.ObjectId,
        ref: 'user',
       // required: true
    }
});





module.exports = mongoose.model('Address', AddressSchema);





