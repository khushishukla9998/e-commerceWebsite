const jwt = require("jsonwebtoken");
const config = require("../../config/dev.json");
const redisClient = require("../component/utils/redisClient");
const appStrings = require("../component/utils/appString")

// Access token
function generateAccessToken(payload) {
  return jwt.sign(payload, config.ACCESS_TOKEN_SECRET, {
    expiresIn: config.ACCESS_TOKEN_TIME,
  });
}

// Refresh token
function generateRefreshToken(payload) {
  return jwt.sign(payload, config.REFRESH_TOKEN_SECRET, {
    expiresIn: config.REFRESH_TOKEN_TIME,
  });
}

//

//verify access Token
// async function verifyAcessToken(req, res, next) {
//   try {
//     const token = req.cookies.accessToken;
//     console.log(token);

//     if (!token) {
//       return res.status(401).json({ message: "Token not provided" });
//     }

//     const decode = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
//     req.accessToken = token;
//     req.refreshToken = req.cookies.refreshToken;
//     req.userId = decode.id;


//     req.type = decode.type;
//     req.headers = decode;
//     console.log(decode);


//      // Check if token exists in Redis
//       const isTokenInRedis = await redisClient.get(token);
//       if(!isTokenInRedis){
//         return res.status(401).json({message: "Invalid or expired token in Redis "});
//       }

//     next();
//   } catch (err) {
//     if (err.name === 'TokenExpiredError') {
//       const expiredToken = req.cookies.accessToken;
//       if (expiredToken) {
//         await redisClient.del(expiredToken).catch(() => { });
//       }
//     }
//     res.status(400).json({ message: "Invalid or expired token" });
//   }
// }


async function verifyAcessToken(req, res, next) {
  const commonUtils = require("../component/utils/commonUtils")
  try {
    const token = req.cookies.accessToken;
    console.log(token);

    if (!token) {
      return commonUtils.sendErrorResponse(req, res, appStrings.TOKEN_NOT_PROVIDED, null, 401);
    }

    const decode = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    req.accessToken = token;
    req.refreshToken = req.cookies.refreshToken;
    req.userId = decode.id;
    req.type = decode.type;
    req.headers = decode;
    console.log(decode);

    // Check if token exists in Redis for this user
    const redisKey = `user:access:${decode.id}`;
    const tokenInRedis = await redisClient.get(redisKey);

    if (!tokenInRedis || tokenInRedis !== token) {
      return commonUtils.sendErrorResponse(req, res, appStrings.INVALID_TOKEN_IN_REDISH, null, 401);
    }

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const expiredToken = req.cookies.accessToken;
      if (expiredToken) {
        // if you use user-based keys, you might want to decode to get id
        try {
          const decoded = jwt.decode(expiredToken);
          if (decoded?.id) {
            await redisClient.del(`user:access:${decoded.id}`);
          }
        } catch (_) { }
      }
    }
    return commonUtils.sendErrorResponse(req, res, appStrings.INVALID_TOKEN, null, 400);
  }
}


// verify refresh token
function verifyRefreshToken(token) {
  return jwt.verify(token, config.REFRESH_TOKEN_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAcessToken,
  verifyRefreshToken,
};
