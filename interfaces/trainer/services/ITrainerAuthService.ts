import { ITrainer } from "../../../types/trainer.types";

export interface ITrainerAuthService {
    authenticateTrainer(email: string, password: string): Promise<ITrainer | null>;
    registerTrainer(trainerData: Partial<ITrainer>): Promise<ITrainer | null>;
    resendOTP(email: string): Promise<{ success: boolean; message: string }>;
    verifyOTP(email: string, otp: string): Promise<boolean>;
    requestPasswordReset(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    getTrainerById(trainerId: string): Promise<ITrainer | null>;
}