import express from "express";
import sendResponse from "../helpers/SendResponse.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import "dotenv/config";
import crypto from "crypto";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail", // Or your email provider's service
  auth: {
    user: process.env.EMAIL, // Your email address
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
});

// Function to send email
function sendEmail(recipientEmail, token) {
  const mailOptions = {
    from: process.env.EMAIL,
    to: recipientEmail,
    subject: "Your Account Password",
    html: `
      <p>Hello,</p>
      <p>Your account has been created successfully. Below is your password:</p>
      <p><strong>${token}</strong></p>
      <p>Please log in and change your password immediately.</p>
    `,
  };

  transporter.sendMail(mailOptions, (error, success) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent successfully.");
    }
  });
}

// Registration route
router.post("/register", async (req, res) => {
  const { fullname, email, cnic } = req.body;
  if (fullname.trim() === "" || email.trim() === "" || cnic.trim() === "") {
    return sendResponse(res, 403, null, true, "All fields are required");
  }
  if (cnic.length !== 13 || isNaN(cnic)) {
    return sendResponse(res, 403, null, true, "CNIC must be a 13-digit number");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendResponse(res, 403, null, true, "User already registered");
  }
  const password = crypto.randomBytes(8).toString("hex");

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await User.create({
      fullname,
      email,
      password: hashedPassword,
      cnic,
    });

    // Send email with the password
    sendEmail(email, password);

    return sendResponse(
      res,
      201,
      newUser,
      false,
      "User registered and password sent via email"
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return sendResponse(res, 500, null, true, "Error registering user");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return sendResponse(res, 403, null, true, "User is not registered");
    }

    // Check if the password provided matches the temporary password (password sent in email)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendResponse(res, 403, null, true, "Invalid credentials");
    }

    // If it's the first login, send a response indicating the user needs to update their password
    if (user.isFirstLogin) {
      return sendResponse(res, 200, { isFirstLogin: true, userId: user._id }, false, "First login, please set a new password");
    }

    // If it's not the first login, generate a token and proceed as usual
    const token = jwt.sign(
      { userid: user._id, email: user.email, fullname: user.fullname },
      process.env.AUTH_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return sendResponse(res, 200, { token, user }, false, "Login successful");
  } catch (error) {
    console.error("Error during login:", error);
    return sendResponse(res, 500, null, true, "Error logging in");
  }
});


  router.post("/change-password", async (req, res) => {
    const { userId, newPassword } = req.body;

    try {
      // Hash the new password before updating
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password and set firstLogin to false after the user changes their password
      await User.findByIdAndUpdate(userId, {
        password: hashedPassword,
        firstLogin: false, // Mark it as no longer the first login
      });

      return sendResponse(res, 200, null, false, "Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
      return sendResponse(res, 500, null, true, "Error updating password");
    }
  });

router.get("/logout", (req, res) => {
  res.cookie("token", null);
  sendResponse(res, 200, null, false, "User Logout Successfully");
});

export default router;
