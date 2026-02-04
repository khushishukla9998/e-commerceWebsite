
const Address = require("../model/addressModel");
const commonUtils = require("../../utils/commonUtils");
const appStrings = require("../../utils/appString");
const { header } = require("express-validator");
const user = require("../model/userModel");
const mongoose = require("mongoose");

//add adress

exports.addAddress = async function (req, res) {
  try {
    const { street, city, state, zipCode } = req.body;
    const userId = req.headers.id;
    console.log("USER ID =>", userId);


    // Validate User ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.ADDRESS_ERROR,
        appStrings.INVALID_HEADERS,
        400
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log("USER ID =>", userObjectId.toString());

    //  count addresses to determine primary
    const totalAddresses = await Address.countDocuments({ userId: userObjectId });
    console.log(`[DEBUG] userId: ${userObjectId}, totalAddresses found: ${totalAddresses}`);

    //  create address
    const isPrimaryAddress = totalAddresses === 0;
    console.log(`[DEBUG] Setting isPrimary to: ${isPrimaryAddress}`);

    const address = new Address({
      street,
      city,
      state,
      zipCode,
      userId: userObjectId,
      isPrimary: isPrimaryAddress, // First address becomes primary
    });

    await address.save();

    return commonUtils.sendSuccessResponse(req, res, appStrings.ADDRESS_ADDED, address);
  } catch (err) {
    console.error("ERROR =>", err);

    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.ADDRESS_ERROR,
      err.message,
      500
    );
  }
};

//==========================addressList============================

exports.getAddress = async function (req, res) {
  try {
    const userId = req.headers.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.ADDRESS_ERROR,
      appStrings.INVALID_ID,
        400
      );
    }

    const address = await Address.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users", // Mongoose  "User" model to "users" collection
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true // Keep address even if user not found (unlikely)
        }
      },
      {
        $project: {
          _id: "$_id",
          street: "$street",
          city: "$city",
          state: "$state",
          zipCode:"$zipCode",
          isPrimary: "$isPrimary",
          userId: "$userId",
          "userName": "$userDetails.name",
          "userEmail": "$userDetails.email"
        },
      },
    ]);

    return commonUtils.sendSuccessResponse(req, res, "Address Fetched Successfully", address);

  } catch (err) {
    console.error(err);
    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.ADDRESS_ERROR,
      err.message,
      500
    );
  }
};

//=========================update secondary address as primary address
exports.setPrimaryAddress = async function (req, res) {
  try {
    const userId = req.headers.id;
    const { addressId } = req.body;

    if (!userId || !addressId) {
      return commonUtils.sendErrorResponse(
        req,
        res,
        appStrings.ADDRESS_ERROR,
        appStrings.ID_REQUIRED,
        400
      );
    }

    // 1 Verify the address belongs to the user
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return commonUtils.sendErrorResponse(req, res, appStrings.ADDRESS_ERROR, appStrings.ADSRESS_NOT_FOUND, 404);
    }

    //  Demote all addresses for this user to secondary
    await Address.updateMany(
      { userId: userId },
      { $set: { isPrimary: false } }
    );

    //  Promote the selected address to primary
    address.isPrimary = true;
    await address.save();

    return commonUtils.sendSuccessResponse(req, res, appStrings.PRIMERY_ADSRESS_UPDATED, address);

  } catch (err) {
    console.error(err);
    return commonUtils.sendErrorResponse(
      req,
      res,
      appStrings.ADDRESS_ERROR,
      err.message,
      500
    );
  }
};
