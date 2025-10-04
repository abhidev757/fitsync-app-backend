import mongoose, { Document } from 'mongoose';


export interface IUserFitness {
    userId: mongoose.Types.ObjectId;
    sex: "Male" | "Female" | null;
    age: number;
    height: number;
    weight: number; 
    targetWeight: number; 
    activity: "Little or No Activity" | "Lightly Active" | "Moderately Active" | "Very Active";
    createdAt?: Date;
    updatedAt?: Date;
  }
  
 export interface UserInfoUpdate {
    sex: "Male" | "Female" | null;
    age: number;
    height: number;
    weight: number;
    targetWeight: number;
    activity: string | null;
  }

  