const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser")
const cors =require("cors")

const path = require("path");
 //const { createClient } = require("redis");
const userIndex = require("./src/component/user/index")


const app = express();
const port =  3000;
app.use(cookieParser());
app.use(cors({
    origin: true,
    credentials: true
  }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api",userIndex);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));




//================databse connection===================================== 

const connectDb =async()=>{
    try{
        await
        mongoose.connect("mongodb://localhost:27017/loginProject");
        console.log("database is connected");
 }
    catch(err){
console.log(err.message)
    }
}

// port declartion 

async function startServer(){
    try{
        await
    
app.listen(port,()=>{
    console.log("server  is running on 3000");
});
    }catch(err){
console.log(err.message,"server error")
    }
}

startServer();
connectDb();