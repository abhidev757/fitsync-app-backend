import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types/user.types";

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImageUrl: {
      type: String,
    },
    isGoogleLogin: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user"],
      default: "user",
    },
    status: {
      type: Boolean,
      default: false,
    },
    resetPassword: {
      token: { type: String, default: null },
      expDate: { type: Date, default: null },
      lastResetDate: { type: Date, default: null },
    },
    phone: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
