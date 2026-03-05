import { ITrainer, ITrainerProfile } from "../../../types/trainer.types";
import { UploadedFile } from "../../../types/UploadedFile.types";

export interface ITrainerProfileService {
    getTrainerProfile(userId: string): Promise<ITrainerProfile | null>;
    updateTrainerProfile(userId: string, userData: Partial<ITrainer>): Promise<{ user: ITrainer | null }>;
    uploadCertificate(file: Express.Multer.File): Promise<UploadedFile>;
    uploadProfile(file: Express.Multer.File): Promise<UploadedFile>;
    uploadAndSaveProfile(file: Express.Multer.File, trainerId: string): Promise<{ fileUrl: string }>;
    getSpecializations(): Promise<{ _id: string; name: string }[]>;
    getPerformanceStats(trainerId: string): Promise<{ labels: string[]; data: number[] }>;
}
