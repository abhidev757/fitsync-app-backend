// payment.model.ts
import mongoose from "mongoose";
import { IPayment } from "../types/user.types";

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trainer",
    required: true
  },
  stripePaymentId: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    required: true
  }
}, { timestamps: true });

export const PaymentModel = mongoose.model<IPayment>("Payment", paymentSchema);