import { IBooking } from "../../models/bookingModel";
import { DaySchedule, ITimeSlotInput, ITimeSlots } from "../../types/timeSlots.types";
import { ITrainer,IBlockedTrainerResponse,IUnblockedTrainerResponse, ITrainerProfile, WalletDetails } from "../../types/trainer.types";
import { UploadedFile } from "../../types/UploadedFile.types";


export interface ITrainerService {
    authenticateTrainer(email: string, password: string): Promise<ITrainer | null>
    registerTrainer(trainerData: Partial<ITrainer>): Promise<ITrainer | null>;
    getTrainerById(trainerId: string): Promise<ITrainer>
    resendOTP(email: string): Promise<{ success: boolean; message: string }>;
    verifyOTP(email: string, otp: string): Promise<boolean>;
    requestPasswordReset(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    getTrainerProfile(userId: string): Promise<ITrainerProfile | null>; 
    updateTrainerProfile(userId: string,userData: Partial<ITrainer>): Promise<{ user: ITrainer | null}>;
    uploadCertificate(file: Express.Multer.File): Promise<UploadedFile>;
    uploadProfile(file: Express.Multer.File): Promise<UploadedFile>;
    addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null>
    getTimeSlots(): Promise<DaySchedule[]>
    getTrainerBookings(trainerId: string): Promise<IBooking[]>
    getBookingDetails(bookingId: string): Promise<IBooking | null>
    cancelBookingByTrainer(bookingId: string): Promise<IBooking>
    getWalletDetails(trainerId: string): Promise<WalletDetails>
}