import { IUser,IBlockedUserResponse,IUnblockedUserResponse, IUserProfile, IUserFitnessResponse } from "../../types/user.types";
import { IUserFitness } from "../../types/userInfo.types";


export interface IUserService {
    authenticateUser(email: string, password: string): Promise<IUser | null>
    registerUser(userData: Partial<IUser>): Promise<IUser | null>;
    getUserById(userId: string): Promise<IUser>
    resendOTP(email: string): Promise<{ success: boolean; message: string }>;
    verifyOTP(email: string, otp: string): Promise<boolean>;
    requestPasswordReset(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    saveFitnessInfo(fitnessData: IUserFitness): Promise<IUserFitness | null>;
    getUserProfile(token: string): Promise<IUserProfile | null>; 
    updateUserAndFitness(userId: string,userData: Partial<IUser>,fitnessData: Partial<IUserFitness>): Promise<{ user: IUser | null; fitness: IUserFitness | null }>;
}