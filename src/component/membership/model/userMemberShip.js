const mongoose = require("mongoose");
const User = require("../../user/model/userModel");
const Plan = require("../../admin/model/memberShipPlanModel");
const { type } = require("node:os");

const userMemberShip = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },

  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Plan,
  },
  stripeCostumerId: {
    type: String,
  },
  stripesubscriptionId: {
    type:String,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
 

  status: 
    {
      type:String,
      enum:["active","expired","cancelled"],
      default:"active"
    },

  orderUsedAfterMemebrShip:{
    type:Number,
    default:0
  }
});

module.exports = mongoose.Model ("userMemberShip", userMemberShip);
