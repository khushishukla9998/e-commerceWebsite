/**
 * ALL USER-FACING STRING MESSAGES
 */
module.exports = {
  REGISTRATION_ERROR: "Registration error!",
  REGISTRATION_FAILED: "Registration failed!",
  REGISTRATION_SUCCESS: "User registrartion successfull",
  LOGIN_SUCCESS: "Login successsfull",
  LOGIN_FAILED: "Login unsuccesssfull",
  USER_NOT_FOUND: "User not Found",
  WRONG_PASSWORD: "Password is invalid!",
  TOKEN_EXPIRED: "Token Expired!",
  USER_EXIST: "User already exist",
  PROFILE_ERROR: "Profile error",
  USER_PROFILE: "User profile is ",
  DELETE_SUCCSESS: "User deleted",
  DELETE_ERROR: "Delete error!",
  LOGOUT_SUCCESS: "LogOut successful",
  LOGOUT_ERROR: "Logout error!",
  UPLOAD_MULTER_ERROR: "Upload failed due to multer error!",
  UPLOAD_ERROR: "Upload failed due to unknown error!",
  UOLOAD_MESSAGE: " No file uploaded!",
  UPLOAD_VALIDATION: "Only JPEG, PNG, and PDF files are allowed!",
  UPLOAD_LIMIT: "File size exceeds 5MB limit!",
  UPLOAD_SUCCESS: "Files uploaded successfully",
  ADDRESS_ADDED: "Address added successfully",
  ADDRESS_ERROR: "Address not added!",
  ADMIN_EXIST: "Admin already exists1",
  EMAIL_USE: "Email already in use!",
  FAILED_FETCH: "Failed to fetch user!",
  INVALID_HEADERS: "Invalid or missing User ID in headers!",
  INVALID_ID: "Invalid or missing User ID!",
  ID_REQUIRED: "User ID and Address ID are required!",
  ADSRESS_NOT_FOUND: "Address not found for this user!",
  PRIMERY_ADSRESS_UPDATED: "Primary Address Updated Successfully",
  PRIMERY_ADSRESS_NOT_FOUND: "No primary address found!",
  REFRESH_TOKEN_MISSING: "Refresh token missing!",
  ACCESS_TOKEN_REFRESHED: "Access token refreshed",
  REFRESH_TOKEN_EXPIRE: "Refresh token expired, please login again!",
  INVALID_REFRESH_TOKEN: "Invalid refresh token!",
  TOKEN_NOT_PROVIDED: "Token not provided!",
  INVALID_TOKEN_IN_REDISH: "Invalid or expired token in Redis!",
  INVALID_TOKEN: "Invalid or expired token!",

  // DATABASE
  DATABASE_CONNECT: "Database is connected",
  SERVER_RUNNING: "Server is running on",
  SERVER_ERROR: "Server error!",

  // REDIS

  REDIS_CONNECT: "Connected to Redis",
  REDIS_CLIENT_ERROR: "'Redis Client Error !'",
  REDIS_FAILED: "Failed to connect to Redis !",

  // NOT AUTHORIZED

  USER_NOT_AUTHORIZED: "You are not Authurized as User !",
  ADMIN_NOT_AUTHORIZED: "You are not Authurized as Admin !",
  USER_ALREADY_DELETED: "User is already deleted and cannot be modified.",
  STATUS_UPDATED: "User status updated successfully.",
  USER_ADMIN_DELETED:
    "Your account has been deleted by Admin. Please contact support.",
  FETCH_SUCCESS: "Fetch successfully",

  //PASSWORD MACHANISM
  OTP_SENT_SUCCESS: "OTP sent successfully",
  OTP_SEND_FAILED: "OTP send failed",
  PASSWORD_MISMATCH: "New password and Confirm password do not match!",
  PASSWORD_MATCH: "New password should not be same as Old password",
  OTP_NOT_VERFIFIED: " Otp not verified",
  OTP_VERIFIED: "Youre OTP is verified",
  INCORRECT_OLD_PASSWORD: "Old password is incorrect",
  PAASWORD_RESET_SUCCESS: "Password reset successfully",
  PASSWORD_RESET_FAILED: "Password reset failed",
  INVALID_OTP: "Otp invalid ",
  OTP_EXPIRED: " Your OTP is Expired ",

  //  main category
  CATEGORY_EXIST: "Category already exist ",
  CATEGORY_ADDED: "Category added successfull",

  //sub cat
  PARENT_CAT_NOT_FOUND: "Parent category not found",
  INVALID_PARENT_CATEGORY: " Invalid Parent Category",
  SUB_CATEGORY_EXIST: "SubCategory already exist in thise category",
  SUB_CATEGORY_ADDED: "Subcategory added successfull within Category",

  //sub cat delete
  INVALID_SUB_CATEGORY: "Invalid SubCategory id",
  SUB_CAT_NOT_FOUND: "Subcategory not found",
  SUB_CAT_DELETE: "Subcategory deleted successfully",

  // main cat delete
  INVALID_CATEGORY: "Invalid Category id",
  CAT_NOT_FOUND: "Category not found",
  CAT_DELETE: " Category and it's sub category are deleted ",

  // update main & sub cat
  NOTHING_TO_UPDATE: "Nothing to update",
  CAT_UPDETED: "Category updated",
  SUB_CAT_UPDETED: " Sub category updated",

  // product strings

  REQUIRED_FIELDS: "Please provide all required fields",
  ALREADY_EXIST: "Product  already exist ",
  ADDED_SUCCESS: "Product added successfully",
  INVALID_PRODUCT_ID: "Invalid Product ID",
  NOT_FOUND: "Product not found",
  PR_UPDATE_SUCCESS: "Product updated successfully",
  PR_DELETED_SUCCESS: "Product delete successfully",

  // placed order
  USER_NOT_AUTH: "User not authenticated",
  INVALID_ADDRESS_ID: "Address ID is required",
  NOT_A_FOUND: "Address not found or does not belong to user",
  EMPTY_CART: "Cart is empty! ADD item in cart",
  NO_VALID_ITEMS: "No valid items in cart to place order",
  STRIP_PAYMENT_ERROE: "Stripe Payment Error",
  ORDER_PLACED_SUCCESS: "Order created Complete payment on client",

  //cancel order
  ORDER_ID_REQUIRED: "Order ID is required",
  ORDER_NOT_FOUND: "Order not found",
  ORDER_CAN_NOT_CANCLED: `Order cannot be cancelled because it is already`,
  CANCELLED_SUCCESSS: "Order cancelled successfully",
  PRODUCT_OUT_OF_STOCK: "product sold out ,item is out of stock",
  INVALID_USER_ID: "Invalid User ID",
  PRODUCTS_FETCHED: "Products fetched successfully",
  USERS_FETCHED: "Users fetched successfully",
  PRODUCT_AVAILABLE: "product is not available",
  ALREADY_IN_CART:
    "thise product is already add in your cart if you want increase quantity please update qty",
  PRODUCTS_FETCHED: "Products fetched successfully",
  ADDRESS_FETCHED_SUCCESS: "Address fetched successfully",

  INVALID_PAYMENT_METHOD: "Invalid payment method",
  PAYMENT_METHOD_CREATED: " Payment method updated",
  METHOD_FAILED: "Payment method not configured by admin ",

  // Promo Validations
  PROMO_INVALID_VALUE: "Discount value must be a positive number.",
  PROMO_PERCENT_LIMIT: "Percentage discount cannot exceed 100%.",
  PROMO_INVALID_DATES: "End date must be greater than or equal to start date.",
  PROMO_DATES_REQUIRED: "Start and end dates are required for automatic promos.",
  PROMO_CANNOT_MODIFY_USED: "Cannot modify or delete a promo code that has already been used.",
  PROMO_MIN_AMOUNT_NOT_MET: "Minimum order amount not met for promo",
  PROMO_ALREADY_USED_AUTO: "Automatic promo already used by you",
  PROMO_NOT_ACTIVE: "Promo code is not active",

  NOT_BOTH: "Use either email or mobile no. !!! NOT both",
  REQUIRED: "email OR mobile no is required",

  //=========promo============
  INVALID_PROMO: "Invalid promo type. Must be 1 (automatic) or 2 (manual).",
  INVALID_PROMO_DISCOUNT: "Invalid discount type. Must be 1 (flat) or 2 (percentage).",
  EXCEED: "Percentage discount cannot exceed 100%.",
  DATE_REQUUIRED: "Start date and End date are required for automatic promos.",
  PROMO_CREATED: "Promo code created successfully.",
  PROMO_NOT_FOUND: "Promo code not found.",
  PROMO_UPDATED: "Promo code updated successfully.",
  PROMO_DELETED: "Promo code deleted successfully.",
  PROMO_FETCHED: "Promo codes fetched successfully.",
  PROMO_ENABLED: "Promo code enabled successfully.",
  PROMO_DISABLED: "Promo code disabled successfully.",
  PROMO_USED: "Cannot update or delete promo code because it has already been used.",
  PROMO_ALREADY_USED: "Promo code has already been used",
  INVALID_PROMO_CODE: "Invalid or ineligible promo code",
  AMOUNT_REQUIRED: "Order amount is required to calculate discount.",
  PROMO_VALIDATED: "Promo details fetched.",
  INVALID_PROMO_ID: "Invalid promo code",

  //==================  Member Ship ==============
  PLAN_CREATED: "Member-Ship plan is created ",
  PLAN_NOT_EXIST: "Plan not found",
  SESSION_CREATED: "Session created",
  NO_ACTIVE: "No active subscription found to cancel.",
  SUCESS_SUBS_CANCEL: "Subscription cancelled and refund initiated successfully!",
  FETCH_REWARD: "Reward history fetched successfully",
  FIRST_FREE: "First order is free!",
  MEMBERSHIP_COMPULSORY: "Membership is compulsory from the second order onwards.",
  ALREADY_ACTIVE: "You already have an active membership.",
  SUBSCRIPTION_NOT_FOUND: "SUBSCRIPTION ID IS NOT FOUND",

  //===========withdraw=============//

  POINTS_REQUIRED: "minimu 500 points are required",
  MEMBERSHIP: "active membership is required",
  MEMB_EXPIRE: " Youre membership is expired",
  LESS_POINTS: " insufficient points in your rewards ",

  MAX_WITHDRAW: "Only 2 withdrawals allowed per month.",
  SILVER_AM_LIMIT: "Maximum withdraw limit per month: ₹5,000",
  GOLD_AM_LIMIT: "Maximum withdraw limit per month: ₹15,000",
  WITHDRAW_SUCCESS: "Withdrawal request created successfully",
  WITHDRAW_IN_PROGRESS: "Withdrawal request is already in progress",
  WITHDRAW_REJECTED_REFUND: "Withdrawal request rejected. Points have been refunded.",
  WITHDRAW_PRIORITY_MSG: "High priority withdrawal request (Platinum)",
  WITHDRAW_MIN_POINTS: "Minimum 500 reward points required to create withdraw request.",

  // New Controller Strings
  WITHDRAW_ONLY_PENDING: "Only pending requests can be rejected",
  EMAIL_OTP_REQUIRED: "email and OTP required",
  EMAIL_VERIFIED: "email is verified",
  MOBILE_OTP_REQUIRED: "mobile no. and OTP required",
  MOBILE_VERIFIED: "mobile no. is verified",
  EMAIL_REQUIRED: "email is required",
  WAIT_FOR_OTP: "please wait before requesting new otp",
  INVALID_CART_ITEMS: "Invalid or empty products array",
  PROD_QTY_REQUIRED: "Product ID and quantity are required",
  EMAIL_MOBILE_REQUIRED: "Email or Mobile number is required",
  VERIFY_EMAIL_FIRST: "First verify your email",
  VERIFY_MOBILE_FIRST: "First verify your mobile number ",
  PLAN_ENABLED: "Plan enabled successfully",
  PLAN_DISABLED: "Plan disabled successfully",
  CART_UPDATED: "Cart updated successfully",
  ITEM_NOT_IN_CART: "Item not found in cart",
  CART_NOT_FOUND: "Cart not found",
  ITEM_REMOVED: "Item removed from cart",
  OTP_FAILED_CONTACT: "Failed to send OTP, please verify your phone number or contact support.",
  OTP_RESENT_SUCCESS: "new otp is sent",
  OTP_RESENT_MOBILE: " new otp  is send",
  USER_ID_HEADER_MISSING: "User ID not found in headers",
  EMAIL_CHANGE_RESTRICTION: "Existing email cannot be changed as it is used for login. You can only add missing fields.",
  MOBILE_CHANGE_RESTRICTION: "Existing mobile number cannot be changed as it is used for login. You can only add missing fields.",
  PROFILE_UPDATE_SUCCESS: "Profile updated successfully",
  MOBILE_NUMBER_REQUIRED: "mobile no. is required",
  WAIT_FOR_OTP_MOBILE: "please wait before rquesting new otp ",
  INVALID_MOBILE_FORMAT: "Invalid Indian mobile number format. Please provide a 10-digit number."
};
