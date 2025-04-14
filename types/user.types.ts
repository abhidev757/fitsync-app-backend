import mongoose, {Document,ObjectId, Types} from "mongoose";

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    profileImageUrl: string;
    role: 'user'
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
    phone: string;
    isBlocked: boolean;

    matchPassword: (enteredPassword: string) => Promise<boolean>;
}

export interface IUserRegistration {
    name: string;
    email: string;
    password: string;
    otp: string;
    otpExpiresAt: Date;
}


export interface IUserProfile {
  _id: Types.ObjectId; 
  userId: Types.ObjectId; 
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  age?: number;
  height?: string;
  sex?: string;
  activity?: string;
  weight?: string;
  targetWeight?: string;
  profileImageUrl?: string;
}

export interface IUserFitnessResponse {
    userId: mongoose.Types.ObjectId;
    sex: "Male" | "Female" | null;
    age: number;
    height: number;
    weight: number;
    targetWeight: number;
    activity: "Little or No Activity" | "Lightly Active" | "Moderately Active" | "Very Active";
  }


export interface CreatePaymentDto {
  userId: mongoose.Types.ObjectId;
  trainerId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: string;
  metadata: PaymentIntentMetadata;
  stripePaymentId?: string;
}


export interface IPayment {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  trainerId: mongoose.Types.ObjectId;
  stripePaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
  
export interface CreateBookingDto {
  userId: string | mongoose.Types.ObjectId;
  trainerId: string | mongoose.Types.ObjectId;
  sessionTime: string;
  startDate: Date | string;
  isPackage: boolean;
  paymentId: string;
  amount: number;
  status?: "confirmed" | "pending" | "cancelled" | "completed"; 
}

  export interface PaymentIntentMetadata {
    userId: string;
    trainerId: string;
    sessionTime: string;
    startDate: string;
    isPackage: string;
  }

export interface IBlockedUserResponse {
    _id: string;
    blockedUsers: string[];
}

export interface IUnblockedUserResponse {
    _id: string;
    blockedUsers: string[];
}