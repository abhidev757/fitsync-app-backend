import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { ITrainer } from "../types/trainer.types";

const TrainerSchema = new mongoose.Schema<ITrainer>(
  {
    name: {
      type: String,
      required: true,
    },
    certificateUrl: {
      type: String,
      required: true,
    },
    profileImageUrl: {
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
    phone: {
      type: String,
    },
    yearsOfExperience: {
      type: Number,
    },
    sex: {
      type: String,
      enum: ["Male", "Female", null],
    },
    specializations: [
      {
        type: String,
      },
    ],
    verificationStatus: {
      type: Boolean,
      default: false,
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
      enum: ["trainer"],
      default: "trainer",
    },
    status: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    rejectReason: {
      type: String,
    },
    resetPassword: {
      token: { type: String, default: null },
      expDate: { type: Date, default: null },
      lastResetDate: { type: Date, default: null },
    },
    otp: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

TrainerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

TrainerSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Trainer = mongoose.model<ITrainer>("trainer", TrainerSchema);

export default Trainer;
