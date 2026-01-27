const  mongoose = require("mongoose");

const ENUM = require("../../utils/enum")
const userSchema = mongoose.Schema({

    name:{
        type:String,
        required:true,

    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
    },
    profileImage: {
        type: String,
      },
    status:{
        type:String,
        default:ENUM.USER_STATUS.ACTIVE
    },
    isDeleted:{
        type:Boolean,
         default:ENUM.DELETE_STATUS.NOT_DELETE
    }
  });
const user = mongoose.model("user",userSchema);
module.exports = user;