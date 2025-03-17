import mongoose, { Schema, Document } from "mongoose";
import { IUserFitness } from "../types/userInfo.types";

export interface IUserFitnessModel extends IUserFitness, Document {}

const UserFitnessSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sex: {
      type: String,
      enum: ["Male", "Female", null],
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 10, 
      max: 120, 
    },
    height: {
      type: Number,
      required: true,
      min: 50, 
      max: 250, 
    },
    weight: {
      type: Number,
      required: true,
      min: 20, 
      max: 300, 
    },
    targetWeight: {
      type: Number,
      required: true,
      min: 20,
      max: 300,
    },
    activity: {
      type: String,
      enum: ["Little or No Activity", "Lightly Active", "Moderately Active", "Very Active"],
      required: true,
    },
  },
  { timestamps: true } 
);


const UserFitness = mongoose.model<IUserFitnessModel>("UserFitness", UserFitnessSchema);
export default UserFitness;
