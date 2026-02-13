module.exports = {
  REGISTRATION_ERROR: "Registration error!",
  REGISTRATION_FAILED: "Registration failed!",
  REGISTRATION_SUCCESS: "User registrartion successfull",
  LOGIN_SUCCESS: "Login successsfull",
  LOGIN_FAILED: "Login successsfull",
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
  OTP_EXPIRED: " Youre OTP is Expired ",

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
  ALREADY_IN_CART: "thise product is already add in your cart if you want increase quantity please update qty",
  PRODUCTS_FETCHED: "Products fetched successfully",
  ADDRESS_FETCHED_SUCCESS: "Address fetched successfully",
};
