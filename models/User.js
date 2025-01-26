import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  cnic: { type: String, required: true, unique: true }, // CNIC for unique identification
  isFirstLogin: { type: Boolean, default: true },
  admin: {type: Boolean, default: false} // To track if the user has updated their password
});


const User = mongoose.model("User", userSchema);
export default User;
