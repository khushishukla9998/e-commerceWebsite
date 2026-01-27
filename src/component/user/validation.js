const{body,validationResult} = require("express-validator");



//registration validator

function registervalidator(){
return[
    body("name")
    .notEmpty()
    .withMessage("Name is Required"),

    body("email").isEmail().withMessage("valid email is requiread"),

    body("password").isLength({min:8}).withMessage("password should be  8 charecter")

];
validate()
}


function loginValidator() {
  return [
    body("email")
      .isEmail()
      .withMessage("Valid email is required"),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password should be at least 8 characters long"),
  ];

}


// Validation Middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};
module.exports={registervalidator,loginValidator,};