const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const path = require("path");
const userIndex = require("./src/component/user/index");
const adminIndex = require("./src/component/admin/index");
// const passwordIndex = require("./src/component/forgot password/index")
 const appStrings  = require("../filestructure/src/component/utils/appString")
 const config = require("./config/dev.json")

const app = express();
const port = 3001; 
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
console.log("======== SERVER FILE LOADED=========")
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  next();
});

app.use("/api", userIndex);
app.use("/api/admin", adminIndex);
// app.use("/api/password",passwordIndex)

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//================databse connection=====================================

const connectDb = async () => {
  try {
    await mongoose.connect(config.MONGO_DB_URL);
    console.log(appStrings.DATABASE_CONNECT);
  } catch (err) {
    console.log(err.message);
  }
};

// port declartion

async function startServer() {
  try {
    app.listen(port, () => {
      console.log( appStrings.SERVER_RUNNING +` ${port}`);
    });
  } catch (err) {
    console.log(err.message,appStrings.SERVER_ERROR );
  }
}

startServer();
connectDb();
