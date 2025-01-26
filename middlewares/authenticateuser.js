import sendResponse from "../helpers/SendResponse.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
import User from "../models/User.js";

const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token || token === "") {
    return sendResponse(res, 403, null, true, "No token provided. Please log in.");
  }
  const data = jwt.verify(token, process.env.AUTH_SECRET);
  if (!data) {
    return sendResponse(res, 403, null, true, "Invalid or expired token.");
  }
  req.user = data;
  sendResponse(res, 200, null, false, "user is authenticated")
  next();
};

export default authenticateUser;
