import Stripe from "stripe";
import { ITrainer } from "../../types/trainer.types";
import { IUser, IBlockedUserResponse,IUnblockedUserResponse, IUserProfile, CreatePaymentDto, CreateBookingDto } from "../../types/user.types";
import { IUserFitness } from "../../types/userInfo.types";
import { IBooking } from "../../models/bookingModel";
import { IPayment } from "../../types/user.types";
import { ISpecialization } from "../../types/specialization.types";
import { UploadedFile } from "../../types/UploadedFile.types";

export interface IUserRepository {
createNewData(userData: Partial<IUser>): Promise<IUser | null>
updateOneById(id: string, data: Partial<IUser>): Promise<IUser | null>;
findByEmail(email: string): Promise<IUser | null>;
register(userData: Partial<IUser>): Promise<IUser | null>;
findById(id: string): Promise<IUser | null>;
update(id: string, data: Partial<IUser>): Promise<IUser | null>;
saveFitnessInfo(fitnessData: IUserFitness): Promise<IUserFitness | null>;
getFitnessInfo(userId: string): Promise<IUserFitness | null>;
findUserProfileById(token: string): Promise<IUserProfile | null>;
updateFitnessInfo(userId: string,fitnessData: Partial<IUserFitness>): Promise<IUserFitness | null>;
findAllTrainers(): Promise<ITrainer[]>;
findTrainerById(userId: string): Promise<ITrainer | null>
createPayment(paymentData: CreatePaymentDto): Promise<IPayment>;
findPaymentByStripeId(stripePaymentId: string): Promise<IPayment | null>;
createBooking(bookingData: CreateBookingDto): Promise<IBooking>;
findPaymentByStripeId(stripePaymentId: string): Promise<IPayment | null>;
findByUserId(userId: string): Promise<IBooking[]>
getAllSpecializations(): Promise<ISpecialization[]>
updatePassword(userId: string, newHashedPassword: string): Promise<void>
uploadProfile(file: Express.Multer.File): Promise<UploadedFile>
updateUserProfilePic(userId: string, fileUrl: string): Promise<IUser | null> 
creditTrainerWallet(trainerId: string, amount: number, sessionId: string, reason: string): Promise<void>
}