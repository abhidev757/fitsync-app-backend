import { IAdmin } from "../../types/admin.types";
import { ISpecialization } from "../../types/specialization.types";
import { ITimeSlots } from "../../types/timeSlots.types";
import { ITrainer } from "../../types/trainer.types";
import { IUser } from "../../types/user.types";


export interface IAdminService {
    authenticateAdmin(email: string, password: string) : Promise<IAdmin | null>
    registerAdmin(email: string, password: string): Promise<void>;
    getAllUsers(): Promise<IUser[]>;
    toggleUserStatus(userId: string, newStatus: boolean): Promise<IUser | null>;
    getAllTrainers(): Promise<ITrainer[]>;
    toggleTrainerStatus(userId: string, newStatus: boolean): Promise<ITrainer | null>;
    getUserById(userId: string): Promise<IUser>
    getTrainerById(userId: string): Promise<ITrainer>
    addSpecialization(name: string, description: string): Promise<ISpecialization | null>;
    getAllSpecializations(): Promise<ISpecialization[]>;
    toggleSpecializationStatus(id: string, isBlock: boolean): Promise<ISpecialization>;
    getAllApplicants(): Promise<ITrainer[]>;
    approveTrainer(id: string): Promise<void>
    rejectTrainer(id: string,reason:string): Promise<void>
}