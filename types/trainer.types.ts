import mongoose, {Document,ObjectId, Types} from "mongoose";

export interface ITrainer extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    phone: string;
    sex: string
    specializations: string[];
    yearsOfExperience: number;
    role: 'trainer'
    resetPassword: {
        token: string | null;
        expDate: Date | null;
        lastResetDate: Date | null;
    };
    otp: string;
    isGoogleLogin: boolean;
    googleId?: string;
    status: boolean;
    otpExpiresAt: Date;
    blockedTrainers: string[];

    matchPassword: (enteredPassword: string) => Promise<boolean>;
}
export interface ITrainerProfile {
  _id: Types.ObjectId;  
  name: string;
  email: string;
  phone?: string;
  sex?: string;
  specializations: string[];
}

export interface ITrainerRegistration {
    name: string;
    email: string;
    password: string;
    specializations: string[]
    otp: string;
    otpExpiresAt: Date;
}

export interface IBlockedTrainerResponse {
    _id: string;
    blockedTrainers: string[];
}

export interface IUnblockedTrainerResponse {
    _id: string;
    blockedTrainers: string[];
}