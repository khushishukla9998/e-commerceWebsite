// const{body,validationResult} = require("express-validator");

// // //registration validator

// // function registervalidator(){
// // return[
// //     body("name")
// //     .notEmpty()
// //     .withMessage("Name is Required"),

// //     body("email").isEmail().withMessage("valid email is requiread"),

// //     body("password").isLength({min:8}).withMessage("password should be  8 charecter")
// // ];
// // }

// // function loginValidator() {
// //   return [
// //     body("email")
// //       .isEmail()
// //       .withMessage("Valid email is required"),

// //     body("password")
// //       .isLength({ min: 8 })
// //       .withMessage("Password should be at least 8 characters long"),
// //   ];

// // }

// // //Validation Middleware
// // const validate = (req, res, next) => {
// //   const errors = validationResult(req);

// //   if (!errors.isEmpty()) {
// //     return res.status(400).json({
// //       success: false,
// //       errors: errors.array(),
// //     });
// //   }

// //   next();
// // };

// // Registration validator
// function registerValidator() {
//   return [
//     body("name")
//       .notEmpty()
//       .withMessage("Name is required"),

//     body("email")
//       .isEmail()
//       .withMessage("Valid email is required"),

//     body("password")
//       .isLength({ min: 8 })
//       .withMessage("Password should be at least 8 characters long"),
//   ];
// }

// // Login validator
// function loginValidator() {
//   return [
//     body("email")
//       .isEmail()
//       .withMessage("Valid email is required"),

//     body("password")
//       .isLength({ min: 8 })
//       .withMessage("Password should be at least 8 characters long"),
//   ];
// }

// // Validation middleware
// const validate = (req, res, next) => {
//   const errors = validationResult(req);

//   if (!errors.isEmpty()) {
//     return res.status(400).json({
//       success: false,
//       errors: errors.array(),
//     });
//   }

//   next();
// };

// module.exports = {
//   registerValidator,
//   loginValidator,
//   validate,
// };





const Validator = require("validatorjs");
const commonUtils = require("../utils/commonUtils")

//for Registartionvalidation 
async function registerValidation(req, res, next) {
  const validationRule = {
    email: `required|string|min:4|max:255`,
    password:
      "required|min:6|max:50|regex:/[A-Z]/|regex:/[0-9]/|regex:/[@$!%*#?&]/",
  };

  // Call common validator utility
  validatorUtilWithCallback(validationRule, {}, req, res, next);
}


async function  loginValidation(req,res,next){

  const validationRule = {
    email
  }
}

/**
 * Common validator utility with callback support
 * - Uses ValidatorJS
 * - Sends formatted validation errors on failure
 */
const validatorUtilWithCallback = (
    rules,
    customMessages,
    req,
    res,
    next
) => {

    // Set validation language from request header (default: en)
    Validator.useLang(req.headers.lang ?? 'en');

    // Create validator instance using request body
    const validation = new Validator(req.body, rules, customMessages);

    // If validation passes, move to next middleware/controller
    validation.passes(() => next());

    // If validation fails, return formatted error response
    validation.fails(() =>
        commonUtils.sendErrorResponse(req, res,validation.errors ,422 
         // ,{ errors: commonUtils.sendErrorResponse(validation.errors.errors)}
         )
    );
};

module.exports = {
  registerValidation
}
