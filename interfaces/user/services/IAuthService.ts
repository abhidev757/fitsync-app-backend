import { IUser } from "../../../types/user.types";

export interface IAuthService {
    authenticateUser(email: string, password: string): Promise<IUser | null>;
    registerUser(userData: Partial<IUser>): Promise<IUser | null>;
    resendOTP(email: string): Promise<{ success: boolean; message: string }>;
    verifyOTP(email: string, otp: string): Promise<boolean>;
    requestPasswordReset(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
    getUserById(userId: string): Promise<IUser>;
}