import mongoose from "mongoose";

// types/timeSlots.types.ts
export interface ITimeSlotInput {
  trainerId: mongoose.Types.ObjectId;
  sessionType: string;
  time: string;
  startDate: string; 
  endDate: string;   
  price: string;
  numberOfSessions: string | null;
}

export interface ITimeSlots extends Document {
  trainerId: mongoose.Types.ObjectId;
  sessionType: string;
  time: string;
  startDate: Date;   
  endDate: Date;    
  price: string;
  numberOfSessions: string | null;
  isBooked : boolean
}

export interface TimeSlot {
  time: string;
  type: "Single Session" | "Package";
}

export interface DaySchedule {
  date: string;         
  slots: TimeSlot[];
}