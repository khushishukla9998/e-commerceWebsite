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
