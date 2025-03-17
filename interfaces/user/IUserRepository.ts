import { IUser, IBlockedUserResponse,IUnblockedUserResponse, IUserProfile } from "../../types/user.types";
import { IUserFitness } from "../../types/userInfo.types";

export interface IUserRepository {
createNewData(userData: Partial<IUser>): Promise<IUser | null>
updateOneById(id: string, data: Partial<IUser>): Promise<IUser | null>;
findByEmail(email: string): Promise<IUser | null>;
register(userData: Partial<IUser>): Promise<IUser | null>;
findById(id: string): Promise<IUser | null>;
update(id: string, data: Partial<IUser>): Promise<IUser | null>;
saveFitnessInfo(fitnessData: IUserFitness): Promise<IUserFitness | null>;
getFitnessInfo(userId: string): Promise<IUserFitness | null>;
findUserProfileById(token: string): Promise<IUserProfile | null>;
updateFitnessInfo(userId: string,fitnessData: Partial<IUserFitness>): Promise<IUserFitness | null>;
}