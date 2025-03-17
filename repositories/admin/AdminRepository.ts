import "reflect-metadata"; 
import { injectable } from "inversify";
import { IAdminRepository } from "../../interfaces/admin/IAdminRepository";
import { IAdmin } from "../../types/admin.types";
import Admin from "../../models/AdminModel";
import User from "../../models/UserModel"
import { BaseRepository } from "../base/BaseRepository";
import { IUser } from "../../types/user.types";
import { ITrainer } from "../../types/trainer.types";
import Trainer from "../../models/TrainerModel";






@injectable()
export class AdminRepository extends BaseRepository<IAdmin> implements IAdminRepository {

    private readonly adminModel = Admin
    private readonly userModel = User;
    private readonly trainerModel = Trainer;
    constructor() {
        super(Admin)
    }
    async authenticate(email: string): Promise<IAdmin | null> {
        try {
            return await this.adminModel.findOne({email});
        } catch(err) {
            console.error("Error during admin authentication:", err);
            throw new Error("Error authenticating admin")
        }
    }

    async create(email: string, password: string): Promise<void> {
        const admin = new this.adminModel({email, password});
        try {
            await admin.save();
        }catch(err) {
            console.error('Error creating admin', err);
            throw new Error('Error creating admin')
        }
    }

    async findAllUsers(): Promise<IUser[]> {
        try {
          return await this.userModel
            .find()
            .select("name email status createdAt");
        } catch (error) {
          console.error("Error fetching users:", error);
          throw new Error("Error fetching users");
        }
      }
    
      async updateUserStatus(
        userId: string,
        newStatus: boolean
      ): Promise<IUser | null> {
        try {
          const updatedUser = await this.userModel.findByIdAndUpdate(
            userId,
            { status: newStatus },
            { new: true }
          ).select('_id name status')
          if (!updatedUser) {
            throw new Error("User not found");
          }
          return updatedUser;
        } catch (error) {
          console.error("Error updating user status:", error);
          throw new Error("Error updating user status");
        }
      }
    async findAllTrainers(): Promise<ITrainer[]> {
        try {
          return await this.trainerModel
            .find()
            .select("name status specializations createdAt");
        } catch (error) {
          console.error("Error fetching users:", error);
          throw new Error("Error fetching users");
        }
      }
    
      async updateTrainerStatus(
        trainerId: string,
        newStatus: boolean
      ): Promise<ITrainer | null> {
        try {
          const updatedTrainer = await this.trainerModel.findByIdAndUpdate(
            trainerId,
            { status: newStatus },
            { new: true }
          ).select('_id name status')
          if (!updatedTrainer) {
            throw new Error("User not found");
          }
          return updatedTrainer;
        } catch (error) {
          console.error("Error updating trainer status:", error);
          throw new Error("Error updating trainer status");
        }
      }

      async findById(userId: string): Promise<IUser | null> {
              try {
                  return await this.userModel.findById(userId);
              } catch (error) {
                  console.error('Error finding User by ID:', error);
                  throw new Error('Failed to find User');
              }
          }
      async findTrainerById(userId: string): Promise<ITrainer | null> {
              try {
                  return await this.trainerModel.findById(userId);
              } catch (error) {
                  console.error('Error finding trainer by ID:', error);
                  throw new Error('Failed to find trainer');
              }
          }
}