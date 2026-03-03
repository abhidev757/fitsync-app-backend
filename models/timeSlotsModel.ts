import mongoose, { Schema } from "mongoose";
import { ITimeSlots } from "../types/timeSlots.types";

const TimeSlotsSchema = new Schema<ITimeSlots>({
  trainerId: {
    type: Schema.Types.ObjectId,
    ref: "trainer",
    required: true,
  },
  time: { type: String, required: true },
  sessionType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
});

// Prevent a trainer from adding the same time slot on the same date twice
TimeSlotsSchema.index({ trainerId: 1, startDate: 1, time: 1 }, { unique: true });

const TimeSlots = mongoose.model<ITimeSlots>("timeSlots", TimeSlotsSchema);
export default TimeSlots;
