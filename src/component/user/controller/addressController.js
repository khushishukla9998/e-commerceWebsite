const Address = require("../model/addressModel");
const utils = require("../../utils/commonUtils");
const STRINGS = require("../../utils/appString");
const { header } = require("express-validator");
const user = require("../model/userModel");
const mongoose = require("mongoose");

//add adress

exports.addAdress = async function (req, res) {
  try {
    const { street, city, state, zipCode, userId } = req.body;
    console.log(req.body);

    console.log(req.headers.id);

    // 4. Create and Save Address
    const address = new Address({
      street,
      city,
      state,
      zipCode,
      userId:req.headers.id,
      // If this is the first address, set it as primary
      isPrimary: false,
    });

    await address.save();

    return utils.sendSuccessResponse(req, res, STRINGS.ADDRESS_ADDED, {
      address: address, // Return the full created object
    });
  } catch (err) {
    return utils.sendErrorResponse(
      req,
      res,
      STRINGS.ADDRESS_ERROR,
      { error: err.message },
      500,
    );
  }
};

exports.getaddress = async function (req, res) {
  try {

      console.log("UserID from header:", req.headers.id);
    const userId = req.headers.id;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "ID header missing" });
    }

    const address = await Address.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $unwind: "$user",
      },
      {
        $project: {
          street: 1,
          city: 1,
          state: 1,
          zipCode: 1,
          userId: 1,
        //   "user._id": 1,
        //   "user.name": 1,
        },
      },
    ]);

    console.log(address);
    res.status(200).json({
      success: true,
      data: address,
    });

  
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// 1. Validate Input
// if (!userId || !street || !city || !state || !zipCode) {
//   return utils.sendErrorResponse(
//     req, res, STRINGS.ADDRESS_ERROR,
//     { error: "All address fields (street, city, state, zipCode, userId) are required" },
//     400
//   );
// }

//  2. Check if User exists
// const userExists = await user.findById(userId);
// if (!userExists) {
//   return res.status(404).json({ message: "User not found" });
// }

//  3.  Check for duplicate address for this user
// const duplicateAddress = await Address.findOne({
//   userId,
//   street,
//   city,
//   state,
//   zipCode,
// });
// if (!userId) {
//   if (duplicateAddress) {
//     return utils.sendErrorResponse(
//       req,
//       res,
//       STRINGS.ADDRESS_ERROR,
//       { error: "This address already exists for this user" },
//       409,
//     );
//   }
// }
