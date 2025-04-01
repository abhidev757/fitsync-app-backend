import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  trainerId: mongoose.Types.ObjectId;
  sessionTime: string;
  startDate: Date;
  endDate?: Date;
  isPackage: boolean;
  paymentId: string;
  amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
}

const BookingSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      validate: {
        validator: (v: any) => mongoose.isValidObjectId(v),
        message: "Invalid user ID format"
      }
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'trainer',
      required: true,
      validate: {
        validator: (v: any) => mongoose.isValidObjectId(v),
        message: "Invalid trainer ID format"
      }
    },
    sessionTime: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isPackage: { type: Boolean, default: false },
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);