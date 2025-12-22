import { IUser } from "../../../types/user.types";

export interface IAuthRepository {
    findByEmail(email: string): Promise<IUser | null>;
    createNewData(userData: Partial<IUser>): Promise<IUser | null>;
    register(userData: Partial<IUser>): Promise<IUser | null>;
    update(id: string, data: Partial<IUser>): Promise<IUser | null>;
    findById(id: string): Promise<IUser | null>;
    updatePassword(userId: string, newHashedPassword: string): Promise<void>;
}