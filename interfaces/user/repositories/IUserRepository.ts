import { IUser, IUserProfile } from "../../../types/user.types";
import { ITrainer } from "../../../types/trainer.types";
import { ISpecialization } from "../../../types/specialization.types";
import { UploadedFile } from "../../../types/UploadedFile.types";

export interface IUserRepository {
    // Generic methods shared with other repos if needed
    findById(id: string): Promise<IUser | null>;
    update(id: string, data: Partial<IUser>): Promise<IUser | null>;
    
    // Profile & Search specific
    findUserProfileById(token: string): Promise<IUserProfile | null>;
    findAllTrainers(): Promise<ITrainer[]>;
    findTrainerById(userId: string): Promise<ITrainer | null>;
    getAllSpecializations(): Promise<ISpecialization[]>;
    uploadProfile(file: Express.Multer.File): Promise<UploadedFile>;
    updateUserProfilePic(userId: string, fileUrl: string): Promise<IUser | null>;
}