const jwt = require("jsonwebtoken");
const config = require("../../config/dev.json");

// Access token
function generateAccessToken(payload) {
  return jwt.sign(payload, config.Acess_Token_Secrete, {
    expiresIn: config.access_token_time,
  });
}

// Refresh token
function generateRefreshToken(payload) {
  return jwt.sign(payload, config.Refresh_Token_Secrete, {
    expiresIn: config.refresh_token_time,
  });
}
 //verify access Token
async function verifyAcessToken(req, res, next) {
  try {
    const token = req.cookies.accessToken;
    console.log(token);

    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    const decode = jwt.verify(token, config.Acess_Token_Secrete);

    req.headers = decode;
    console.log(decode);

    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
}

// verify refresh token 
function verifyRefreshToken(token) {
  return jwt.verify(token, config.Refresh_Token_Secrete);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAcessToken,
  verifyRefreshToken,
};