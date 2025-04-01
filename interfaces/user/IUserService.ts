import Stripe from "stripe";
import { ITrainer, ITrainerProfile } from "../../types/trainer.types";
import { IUser,IBlockedUserResponse,IUnblockedUserResponse, IUserProfile, IUserFitnessResponse, PaymentIntentMetadata, CreateBookingDto } from "../../types/user.types";
import { IUserFitness } from "../../types/userInfo.types";
import { IBooking } from "../../models/bookingModel";


export interface IUserService {
    authenticateUser(email: string, password: string): Promise<IUser | null>
    registerUser(userData: Partial<IUser>): Promise<IUser | null>;
    getUserById(userId: string): Promise<IUser>
    resendOTP(email: string): Promise<{ success: boolean; message: string }>;
    verifyOTP(email: string, otp: string): Promise<boolean>;
    requestPasswordReset(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    saveFitnessInfo(fitnessData: IUserFitness): Promise<IUserFitness | null>;
    getUserProfile(token: string): Promise<IUserProfile | null>; 
    updateUserAndFitness(userId: string,userData: Partial<IUser>,fitnessData: Partial<IUserFitness>): Promise<{ user: IUser | null; fitness: IUserFitness | null }>;
    getAllTrainers(): Promise<ITrainer[]>;
    getTrainer(userId: string):Promise<ITrainerProfile | null>
    createPaymentIntent(amount: number, trainerId: string, metadata: PaymentIntentMetadata): Promise<Stripe.PaymentIntent>;
    createBooking(bookingData: Partial<IBooking>): Promise<IBooking>;
    getUserBookings(userId: string): Promise<IBooking[]>;
}