import { IUser, IUserProfile } from "../../../types/user.types";
import { ITrainer, ITrainerProfile } from "../../../types/trainer.types";
import { ISpecialization } from "../../../types/specialization.types";
import { UploadedFile } from "../../../types/UploadedFile.types";
import { IUserFitness } from "../../../types/userInfo.types";

export interface IUserService {
    getUserById(userId: string): Promise<IUser>;
    getUserProfile(token: string): Promise<IUserProfile | null>;
    updateUserAndFitness(userId: string, userData: Partial<IUser>, fitnessData: Partial<IUserFitness>): Promise<{ user: IUser | null; fitness: IUserFitness | null }>;
    getAllTrainers(): Promise<ITrainer[]>;
    getTrainer(userId: string): Promise<ITrainerProfile | null>;
    getAllSpecializations(): Promise<ISpecialization[]>;
    uploadProfile(file: Express.Multer.File, userId: string): Promise<UploadedFile>;
}