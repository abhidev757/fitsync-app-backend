import { IAdmin } from "../../types/admin.types";
import { ISpecialization } from "../../types/specialization.types";
import { ITrainer } from "../../types/trainer.types";
import { IUser } from "../../types/user.types";



export interface IAdminRepository {
    authenticate(email: string): Promise<IAdmin | null>;
    create(email: string, password: string): Promise<void>
    findAllUsers(): Promise<IUser[]>;
    updateUserStatus(userId: string, newStatus: boolean): Promise<IUser | null>;
    findAllTrainers(): Promise<ITrainer[]>;
    updateTrainerStatus(userId: string, newStatus: boolean): Promise<ITrainer | null>;
    findById(id: string): Promise<IUser | null>;
    findTrainerById(id: string): Promise<ITrainer | null>;
    addSpecialization(name: string, description: string): Promise<ISpecialization>;
    getAllSpecializations(): Promise<ISpecialization[]>;
    toggleSpecializationStatus(id: string, isBlock: boolean): Promise<ISpecialization>;
    getAllApplicants(): Promise<ITrainer[]>;
    approveTrainer(id: string): Promise<void>
    rejectTrainer(id: string,reason:string): Promise<void>
}