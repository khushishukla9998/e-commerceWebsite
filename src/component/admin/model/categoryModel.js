const mongoose = require("mongoose");


const categoriesSchema = mongoose.Schema({

   categoryName:{
    type:String,
    required:true
   },

   image:{
      type:String,
      required:true
   },

   parentCategoryId:{
    type:mongoose.Types.ObjectId,
    ref:"Category",
    default:null
   },
  status: {
          type: Number,
          enum:[0,1],
          default: 0
  
  }
});

module.exports =  mongoose.model("Category", categoriesSchema);;

