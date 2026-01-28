
const multer = require("multer");
const path = require("path");
const fs =require("fs");
const middelwareIndex  =require("../../middleware/index")

//===================successResponse===========================
function sendSuccessResponse(res, message, data = null, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

//=====================errorResopnse=====================

function sendErrorResponse(res, message, data = null, status = 422) {
  return res.status(status).json({
    success: false,
    message,
    data,
  });
}



// Set access token cookie
function storeAcessTokenInCookie(res, name, tokenValue) {
  res.cookie(name, tokenValue, {
    httpOnly: true,
    sameSite: "lax",
  
  });
}

// Set refresh token cookie
function storeRefreshTokenInCookie(res, name, tokenValue) {
  res.cookie(name, tokenValue, {
    httpOnly: true,
    sameSite: "lax",
   
  });
}




//=============multer======================================



// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     //cb(null, "src/uploads"); // upload folder
    
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueName + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// module.exports = {
//   upload,
// };



const uploadPath = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath); // ✅ correct directory
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });





//========================route handler=====================================
const routeArray = (array_, prefix) => {
    
array_.forEach((route) => {
    const method = route.method ;
    const path = route.path;
    const controller = route.controller;
    const validation = route.validation;

    let middlewares = [];
  
    const isPublic = route.isPublic === undefined ? false : route.isPublic;
    // Middleware to log the request IP and userId

    if (!isPublic) {
        middlewares.push(middelwareIndex.verifyAcessToken);
    }

    if (validation) {
        if (Array.isArray(validation)) {
            middlewares.push(...validation);
        } else {
            middlewares.push(validation);
        }
    }
    middlewares.push(controller);
    prefix[method](path, ...middlewares);
});

return prefix;
};






  
module.exports = {
  upload,
  routeArray,
  sendSuccessResponse,
  sendErrorResponse,
  storeAcessTokenInCookie,
  storeRefreshTokenInCookie,
};