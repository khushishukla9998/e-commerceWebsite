const User = require("../model/userModel");
const Withdraw = require("../model/withdrwaModel")
const UsermeberShip = require("../model/userMemberShip");
const MemberShipPlan = require("../../admin/model/memberShipPlanModel");
const Wallet = require("../model/walletModel")
const commonUtils = require("../../utils/commonUtils")
const appString = require("../../utils/appString");
const ENUM = require("../../utils/enum");


// const withdrwaRequest = async (req, res) => {

//     try {
//         const { points } = req.body;
//         const userId = req.user.id;

//         if (points < 500) {
//             return commonUtils.sendErrorResponse(req, res, appString.POINTS_REQUIRED, null)
//         }

//         const membership = await UsermeberShip.findOne({ userId: userId, status: ENUM.MEMBERSHIP_STATUS.ACTIVE })

//         console.log("user id is here ", userId);
//         console.log("user status:::", membership.status);

//         if (!membership) {
//             return commonUtils.sendErrorResponse(req, res, appString.MEMBERSHIP, null)
//         }
//         const endDate = new Date(membership.endDate)

//         if (endDate < new Date()) {
//             return commonUtils.sendErrorResponse(req, res, appString.MEMB_EXPIRE, null)
//         }

//         console.log("end date;::::::", endDate)

//         const user = await User.findById(userId)

//         console.log("user##:::::::::::", user);


//         if (user.rewardPoints < points) {

//             return commonUtils.sendErrorResponse(req, res, appString.LESS_POINTS, null)
//         }

//         console.log("hhhhhhhhhhhhhhhhhhhhhhhhh")

//         const now = new Date();
//         const month = now.getMonth() + 1;
//         const year = now.getFullYear();

//         console.log("requsetMonth::::::::::", month,)
//         console.log("requsetYear::::::::::", year)

//         const monthlyCount = await Withdraw.countDocuments({
//             userId: userId,
//             requsetMonth: month,
//             requsetYear: year
//         })
//         console.log(monthlyCount)

//         // console.log("userId::::::::::", monthlyCount.userId,)
//         // console.log("requsetMonth::::::::::", monthlyCount.requsetMonth,)
//         // console.log("requsetYear::::::::::", monthlyCount.requsetYear,)

//         if (monthlyCount >= 2) {
//             return commonUtils.sendErrorResponse(req, res, appString.MAX_WITHDRWA, null);
//         }

//         const plan = await MemberShipPlan.findById(membership.planId)
//         console.log("plan:::::::", plan)

//         const amount = points / 10

//         console.log("amount:::::::", amount)

//         let processingFeeAmount = 0;
//         let isFeeFree = false;
//         let Priority = ENUM.PRIORITY.LOW;
//         let finelAmount = 0

//         if (plan.name = ENUM.MEMBERSHIP_PLAN_NAME.SILVER) {
//             if (amount > 5000) {
//                 return commonUtils.sendErrorResponse(req, res, appString.SILVER_AM_LIMIT, null);
//             }

//             processingFeeAmount = amount * 0.1
//             console.log(processingFeeAmount)
//         }
//         console.log("hhhhhhhhhhhhhhhhhhhhhhhhh")


//         if (plan.name = ENUM.MEMBERSHIP_PLAN_NAME.GOLD) {
//             if (amount > 15000) {
//                 return commonUtils.sendErrorResponse(req, res, appString.SILVER_AM_LIMIT, null);
//             }
//             if (monthlyCount == 0) {
//                 isFeeFree = true
//             }
//             else {
//                 processingFeeAmount = amount * 0.05
//                 console.log(processingFeeAmount)
//             }
//         }
//         console.log("hhhhhhhhhhhhhhhhhhhhhhhhh")

//         if (plan.name = ENUM.MEMBERSHIP_PLAN_NAME.PLATINUM) {
//             Priority = ENUM.PRIORITY.HIGH;
//         }
//         console.log("hhhhhh555hhhhhhhhhhhhhhhhhhh")


        // finelAmount = amount - processingFeeAmount;
        // console.log(finelAmount)




//         const withdrawReq = Withdraw.create({
//             userId,
//             // memnberShipId: membership._id,
//             planName: plan.name,
//             pointsUsed: points,
//             amount: amount,
//             processingFeeAmount,
//             finelAmount: finelAmount,
//             requsetMonth,
//             requsetYear,
//             isFeeFree,
//             Priority
//         })


//         user.rewardPoints -= points;
//         await user.save();


//         await Wallet.create({
//             userId: userId,
//             amount: amount,

//         });


//         return commonUtils.sendSuccessResponse(req, res, appString.SUCRESS_WITHDRAW, withdrawReq)

//     }
//     catch (err) {
//         return commonUtils.sendErrorResponse(req, res, err.mesaage);
//     }
// }

const withdrwaRequest = async (req, res) => {
    try {
        const { points } = req.body;
        const userId = req.user.id;

  
        if (points < 500) {
            return commonUtils.sendErrorResponse(req, res, appString.POINTS_REQUIRED, null)
        }

        const membership = await UsermeberShip.findOne({ userId: userId, status: ENUM.MEMBERSHIP_STATUS.ACTIVE })
        if (!membership) {
            return commonUtils.sendErrorResponse(req, res, appString.MEMBERSHIP, null)
        }

        const user = await User.findById(userId);
        if (user.rewardPoints < points) {
            return commonUtils.sendErrorResponse(req, res, appString.LESS_POINTS, null);
        }

        const endDate = new Date(membership.endDate)
        if (endDate < new Date()) {
            return commonUtils.sendErrorResponse(req, res, appString.MEMB_EXPIRE, null)
        }

     
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
  const monthlyCount = await Withdraw.countDocuments({
            userId: userId,
            requestMonth: month,
            requestYear: year
        })
        console.log(monthlyCount)


        if (monthlyCount >= 2) {
            return commonUtils.sendErrorResponse(req, res, appString.MAX_WITHDRWA, null);
        }

        const plan = await MemberShipPlan.findById(membership.planId)
        const amount = points / 10 
        let processingFeeAmount = 0; 
         let isFeeFree = false;
        let Priority = ENUM.PRIORITY.LOW;
        let finelAmount = 0

       finelAmount = amount - processingFeeAmount;
        console.log(finelAmount)

            const withdrawReq = Withdraw.create({
            userId,
            memnberShipId: membership._id,
            planName: plan.name,
            pointsUsed: points,
            amount: amount,
            processingFeeAmount,
            finelAmount: finelAmount,
            // requestMonth,
            // requestYear,
            isFeeFree,
            Priority
    })


        user.rewardPoints -= points;
        await user.save();

                await Wallet.create({
            userId: userId,
            amount: amount,

        });

        return commonUtils.sendSuccessResponse(req, res, "Withdrawal request created successfully", withdrawReq);

    } catch (error) {
        console.error(error);
        return commonUtils.sendErrorResponse(req, res, error.message, null);
    }
}

module.exports = { withdrwaRequest }

