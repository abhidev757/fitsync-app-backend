import { IAdmin } from "../../types/admin.types";
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
}