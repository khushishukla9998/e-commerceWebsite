/**
 * DEFINITION OF ALL ENUMS IN THE SYSTEM
 */
module.exports = {
  //user status
  USER_STATUS: {
    ACTIVE: 1,
    INACTIVE: 0,
  },

  // delete status
  DELETE_STATUS: {
    NOT_DELETE: 0,
    USER_DELETE: 1,
    ADMIN_DELETE: 2,
  },

  ORDER_STATUS: {
    PENDING: 0,
    FAILED: 1,
    SUCCESS: 2,
    CANCELLED: 3,
    SHIPED: 4,
    DELIVERD: 5,
  },

  PAYMENT_STATUS: {
    PENDING: 0,
    FAILED: 1,
    SUCCESS: 2,
    CANCELLED: 3,
    REFUNDED: 4,
  },

  PAYMENT_METHOD: {
    STRIPE: 1,
    RAZOR_PAY: 2,
    COD: 3,
  },
  PROMO_TYPE: {
    AUTOMATIC: 1,
    MANUAL: 2,
  },
  DISCOUNT_TYPE: {
    FLAT: 1,
    PERCENTAGE: 2,
  },
  MEMBERSHIP_STATUS: {
    ACTIVE: 1,
    EXPIRED: 2,
    CANCELLED: 3,
  },
  REWARD_TYPE: {
    EARNED: 1,
    REDEEMED: 2,
  },
  MEMBERSHIP_PLAN_NAME: {
    SILVER: 1,
    GOLD: 2,
    PLATINUM: 3,
  },
};
