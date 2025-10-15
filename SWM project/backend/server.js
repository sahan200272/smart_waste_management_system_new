// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();


// ✅ Middleware
app.use(cors());
app.use(express.json());


let mongoURL = process.env.MONGO_URL;

mongoose.connect(mongoURL);
let connection = mongoose.connection;
connection.once("open", ()=>{
  console.log("MongoDB connection established successfully!")
})


app.listen(4000, ()=>{
  console.log('listening on Port 4000')
});