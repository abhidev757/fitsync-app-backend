import { injectable } from "inversify";
import mongoose, { Error } from "mongoose";
import User from "../../models/UserModel";
import { IUser, IUserProfile } from "../../types/user.types";
import { BaseRepository } from "../base/BaseRepository";
import { IUserRepository } from "../../interfaces/user/IUserRepository";
import { IUserFitness } from "../../types/userInfo.types";
import UserFitness from "../../models/UserInfo";
import { HydratedDocument } from "mongoose";




@injectable()
export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
    private readonly UserModel = User;
    private readonly UserFitnessModel = UserFitness;

    constructor() {
        super(User)
    }

    async findByEmail(email: string): Promise<IUser | null> {
        try{
            return await this.UserModel.findOne({email})
        } catch(err) {
            console.error('Error finding User by email:', err);
            throw new Error('Failer to find User by email')
        }
    }

    async register(userData: IUser): Promise<IUser | null> {
        try {
            const user = new this.UserModel(userData)
            return await user.save();
        } catch(err) {
            console.error('Error finding User by ID:', err);
            throw new Error('Failed to find User')
        }
    }

    async findById(userId: string): Promise<IUser | null> {
        try {
            return await this.UserModel.findById(userId);
        } catch (error) {
            console.error('Error finding User by ID:', error);
            throw new Error('Failed to find User');
        }
    }

    async update(userId: string, data: Partial<IUser>): Promise<IUser | null> {
        try {
            return await this.UserModel.findByIdAndUpdate(userId, { $set: data }, { new: true });
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Error('Failed to update user');
        }
    }

    async saveFitnessInfo(fitnessData: IUserFitness): Promise<IUserFitness | null> {
        try {
            const userFitness = new UserFitness(fitnessData);

            // Save the document
            await userFitness.save();

            return userFitness;
        } catch (error) {
            console.error("Error saving fitness info:", error);
            throw new Error("Failed to save fitness info");
        }
    }

    async getFitnessInfo(userId: string): Promise<IUserFitness | null> {
        try {
            const fitnessData = await this.UserFitnessModel.findOne({ userId });
            if (!fitnessData) throw new Error("User fitness data not found");
            return fitnessData;
        } catch (error) {
            console.error("Error retrieving fitness info:", error);
            throw new Error("Failed to retrieve fitness info");
        }
    }

    

    async findUserProfileById(token: string): Promise<IUserProfile | null> {
        try {
          console.log("Fetching user profile for token:", token);
      
          // Fetch user data
          const user = await User.findById(token).select("-password").lean<{
            _id: mongoose.Types.ObjectId;
            name: string;
            email: string;
            phone?: string;
            avatar?: string;
          }>();
          console.log("User data from database:", user);
      
          if (!user) return null;
      
          // Fetch user fitness data
          const userInfo = await this.UserFitnessModel.findOne({ userId: token }).lean<{
            age?: number;
            height?: string;
            sex?: string;
            activity?: string;
            weight?: string;
            targetWeight?: string;
          }>();
          console.log("User fitness data from database:", userInfo);
      
          // Combine user and userInfo data
          const userProfile: IUserProfile = {
            _id: user._id,
            userId: new mongoose.Types.ObjectId(token),
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            age: userInfo?.age || 0, 
            height: userInfo?.height || "N/A", 
            sex: userInfo?.sex || "N/A", 
            activity: userInfo?.activity || "N/A", 
            weight: userInfo?.weight || "N/A", 
            targetWeight: userInfo?.targetWeight || "N/A", 
          };
      
          console.log("Combined user profile:", userProfile);
          return userProfile;
        } catch (error) {
          console.error("Error in findUserProfileById:", error);
          throw new Error("Failed to fetch user profile");
        }
      }

      async updateFitnessInfo(
        userId: string,
        fitnessData: Partial<IUserFitness>
      ): Promise<IUserFitness | null> {
        try {
          const updatedFitness = await this.UserFitnessModel.findOneAndUpdate(
            { userId },
            fitnessData,
            { new: true, upsert: true }
          );
      
          return updatedFitness;
        } catch (error) {
          console.error("Error updating fitness info:", error);
          throw new Error("Failed to update fitness info");
        }
      }
}