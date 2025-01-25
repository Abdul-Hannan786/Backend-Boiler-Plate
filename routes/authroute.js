import express from "express";
import sendResponse from "../helpers/sendResponse.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { fullname, email, password } = req.body;
  const user = await User.findOne({ email });
  if (user)
    return sendResponse(res, 403, null, true, "User already Registered.");

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    fullname,
    email,
    password: hashedPassword,
  });
  delete newUser.password;
  const token = jwt.sign(
    { userid: newUser._id, newUser: newUser.email, fullname: newUser.fullname },
    process.env.AUTH_SECRET
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 *60*1000,
  });
  sendResponse(res, 201, newUser, false, "User Registered Successfully");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).lean();
  if (!user)
    return sendResponse(res, 403, null, true, "User is not registered");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    return sendResponse(res, 403, null, true, "Invalid Credentials");

  delete user.password;

  var token = jwt.sign(
    { userid: user._id, email: user.email, fullname: user.fullname },
    process.env.AUTH_SECRET
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 *60*1000,
  });
  sendResponse(
    res,
    200,
    {
      user,
      token,
    },
    false,
    "User Login Successfully"
  );
});

router.get("/logout", (req, res) => {
  res.cookie("token", null);
  sendResponse(res, 200, null, false, "User Logout Successfully");
});

export default router;
