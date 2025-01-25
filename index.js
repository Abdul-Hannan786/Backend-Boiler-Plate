import express from "express";
import mongoose from "mongoose";
import cors from "cors"
import "dotenv/config";
import authRoutes from "./routes/authroute.js";
import cookieParser from "cookie-parser";
import authenticateUser from "./middlewares/authenticateuser.js"


const app = express();
app.use(express.json())
app.use(express.urlencoded())
app.use(cors("*"))
app.use(cookieParser())

mongoose.connect(process.env.MONGODB_URI).then(() => console.log("DB connected"))
  .catch((err) => console.log(err))


app.get("/", authenticateUser, (req, res)=> {
   console.log(req.user)
})


app.use('/auth', authRoutes)


app.listen(process.env.PORT, () =>
  console.log(`Server is running on PORT ${process.env.PORT}`)
);
