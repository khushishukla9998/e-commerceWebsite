const User = require("../model/userModel");
const Withdraw = require("../model/withdrwaModel")
const UsermeberShip = require("../model/userMemberShip");
const MemberShipPlan = require("../../admin/model/memberShipPlanModel");
const Wallet = require("../model/walletModel")
const commonUtils = require("../../utils/commonUtils")
const appString = require("../../utils/appString");
const ENUM = require("../../utils/enum");


const withdrwaRequest = async (req, res) => {
    try {
        const { points } = req.body;
        const userId = req.user.id;

        if (!points || points < 500) {
            return commonUtils.sendErrorResponse(req, res, appString.WITHDRAW_MIN_POINTS, null);
        }

        //  Active membership check
        const membership = await UsermeberShip.findOne({
            userId: userId,
            status: ENUM.MEMBERSHIP_STATUS.ACTIVE
        }).populate("planId");

        if (!membership) {
            return commonUtils.sendErrorResponse(req, res, appString.MEMBERSHIP, null);
        }

        //  Expiry check
        const endDate = new Date(membership.endDate);
        if (endDate < new Date()) {
            return commonUtils.sendErrorResponse(req, res, appString.MEMB_EXPIRE, null);
        }

        const user = await User.findById(userId);
        if (user.rewardPoints < points) {
            return commonUtils.sendErrorResponse(req, res, appString.LESS_POINTS, null);
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // 4. Maximum 2 withdraw requests allowed per month
        const monthlyCount = await Withdraw.countDocuments({
            userId: userId,
            requestMonth: month,
            requestYear: year,
            status: { $ne: ENUM.WITHDRAW_STATUS.REJECTED } // Only count non-rejected requests
        });

        const plan = membership.planId;
        const planId = await MemberShipPlan.findById(plan)
        if (!planId) {
            return commonUtils.sendErrorResponse(req, res, appString.PLAN_NOT_EXIST, null);
        }

         if (planId.isfreeWithdraw != null) {
            if (monthlyCount >= (2 + planId.isfreeWithdraw)) {
                return commonUtils.sendErrorResponse(req, res, appString.MAX_WITHDRAW, null);
            }
        }


        const amount = points / 10;

        // Plan Based Withdraw Conditions
        if (plan.maxWithdrawLimit > 0) {
            const monthlyAmountResult = await Withdraw.aggregate([
                { $match: { userId: userId, requestMonth: month, requestYear: year, status: { $ne: ENUM.WITHDRAW_STATUS.REJECTED } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            const currentTotal = monthlyAmountResult.length > 0 ? monthlyAmountResult[0].total : 0;
            if (currentTotal + amount > plan.maxWithdrawLimit) {
                const limitMsg = planId.isfreeWithdraw === 0 ? appString.SILVER_AM_LIMIT : appString.GOLD_AM_LIMIT;
                return commonUtils.sendErrorResponse(req, res, limitMsg, null);
            }
        }

        let processingFeeAmount = 0;
        let Priority = ENUM.PRIORITY.LOW;

        if (planId.isfreeWithdraw = null) {
            Priority = ENUM.PRIORITY.HIGH;
        }

        if (plan.processingFee > 0) {
            let applyFee = true;
            if (plan.isfreeWithdraw === 1 && monthlyCount === 0) {
                applyFee = false;
            }

            if (applyFee) {
                processingFeeAmount = (amount * plan.processingFee) / 100;
            }
        }

        const finelAmount = amount - processingFeeAmount;

        const withdrawReq = await Withdraw.create({
            userId,
            memnberShipId: membership._id,
            planId: plan._id,
            planName: plan.name,
            pointsUsed: points,
            amount: amount,
            processingFeeAmount,
            finelAmount: finelAmount,
            requestMonth: month,
            requestYear: year,
            Priority,
            status: ENUM.WITHDRAW_STATUS.PENDING
        });

        user.rewardPoints -= points;
        await user.save();

        // create  wallet 
        const existingWallet = await Wallet.findOne({ userId });
        if (!existingWallet) {
            await Wallet.create({ userId, balance: 0 });
            console.log(`Wallet created for user ${userId} upon withdrawal request.`);
        }

        return commonUtils.sendSuccessResponse(req, res, appString.WITHDRAW_SUCCESS, withdrawReq);

    } catch (error) {
        console.error(error);
        return commonUtils.sendErrorResponse(req, res, error.message, null);
    }
}

const rejectWithdraw = async (req, res) => {
    try {
        const { requestId } = req.body;

        const withdrawReq = await Withdraw.findById(requestId);
        if (!withdrawReq) {
            return commonUtils.sendErrorResponse(req, res, appString.NOT_FOUND, null);
        }

        if (withdrawReq.status !== ENUM.WITHDRAW_STATUS.PENDING) {
            return commonUtils.sendErrorResponse(req, res, appString.WITHDRAW_ONLY_PENDING, null);
        }
        
        withdrawReq.status = ENUM.WITHDRAW_STATUS.REJECTED;
        withdrawReq.processedAt = new Date();
        await withdrawReq.save();

   
        const user = await User.findById(withdrawReq.userId);
        if (user) {
            user.rewardPoints += withdrawReq.pointsUsed;
            await user.save();
        }

        return commonUtils.sendSuccessResponse(req, res, appString.WITHDRAW_REJECTED_REFUND, withdrawReq);

    } catch (error) {
        console.error(error);
        return commonUtils.sendErrorResponse(req, res, error.message, null);
    }
}

module.exports = { withdrwaRequest, rejectWithdraw }

