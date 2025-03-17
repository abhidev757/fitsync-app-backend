import { ITrainer,IBlockedTrainerResponse,IUnblockedTrainerResponse, ITrainerProfile } from "../../types/trainer.types";


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
}