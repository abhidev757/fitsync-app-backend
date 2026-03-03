import mongoose from "mongoose";

export interface ITimeSlotInput {
  trainerId: mongoose.Types.ObjectId;
  sessionType: string;
  time: string;
  startDate: string;
  endDate: string;
  price: string;
  bufferMinutes?: number;
}

export interface ITimeSlotBulkInput {
  trainerId: mongoose.Types.ObjectId;
  days: string[];           // e.g. ["Mon","Wed","Fri"]
  blockStart: string;       // "09:00"
  blockEnd: string;         // "17:00"
  durationMinutes: number;  // 30 | 45 | 60 | 90
  lunchStart?: string;      // "12:00" | undefined
  lunchEnd?: string;        // "13:00" | undefined
  price: string;
}

export interface ITimeSlots extends Document {
  trainerId: mongoose.Types.ObjectId;
  sessionType: string;
  time: string;
  startDate: Date;
  endDate: Date;
  price: string;
  isBooked: boolean;
}

export interface TimeSlot {
  time: string;
  type: string;
  id: string;
}

export interface DaySchedule {
  date: string;
  slots: TimeSlot[];
}