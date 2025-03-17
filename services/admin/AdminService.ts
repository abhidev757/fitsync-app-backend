import 'reflect-metadata'
import {inject, injectable} from "inversify"
import { IAdminService } from "../../interfaces/admin/IAdminService"
import { IAdmin } from "../../types/admin.types"
import { IAdminRepository } from "../../interfaces/admin/IAdminRepository";
import { IUser } from '../../types/user.types';
import { ITrainer } from '../../types/trainer.types';


@injectable()
export class AdminService implements IAdminService {
    constructor(@inject("IAdminRepository") private adminRepository: IAdminRepository) {}

    async authenticateAdmin(email: string, password: string): Promise<IAdmin | null> {
        const admin = await this.adminRepository.authenticate(email);
        
        if(admin && (await admin.matchPassword(password))) {
            return admin
        }
        return null
    }

    async registerAdmin(email: string, password: string): Promise<void> {
        try {
            await this.adminRepository.create(email,password);
        }catch(err) {
            console.log(err);
            throw new Error('Failed to register admin')
            
        }
    }

    async getAllUsers(): Promise<IUser[]> {
        try {
          return await this.adminRepository.findAllUsers();
        } catch (error) {
          console.log(error);
          throw new Error("Failed to retrieve users");
        }
      }
    
      async toggleUserStatus(
        userId: string,
        status: boolean
      ): Promise<IUser | null> {
        try {
          return await this.adminRepository.updateUserStatus(userId, status);
        } catch (error) {
          console.log(error);
          throw new Error("Failed to toggle user status");
        }
      }
    async getAllTrainers(): Promise<ITrainer[]> {
        try {
          return await this.adminRepository.findAllTrainers();
        } catch (error) {
          console.log(error);
          throw new Error("Failed to retrieve trainers");
        }
      }
    
      async toggleTrainerStatus(
        trainerId: string,
        status: boolean
      ): Promise<ITrainer | null> {
        try {
          return await this.adminRepository.updateTrainerStatus(trainerId, status);
        } catch (error) {
          console.log(error);
          throw new Error("Failed to toggle trainer status");
        }
      }

      async getUserById(userId: string): Promise<IUser> {
        try {
            const user = await this.adminRepository.findById(userId);
            if (!user) {
                throw new Error('user not found');
            }
            return user;
        } catch (error) {
            console.log(error);
            throw new Error('Failed to Fetch user');
        }
    }

      async getTrainerById(userId: string): Promise<ITrainer> {
        try {
            const user = await this.adminRepository.findTrainerById(userId);
            if (!user) {
                throw new Error('trainer not found');
            }
            return user;
        } catch (error) {
            console.log(error);
            throw new Error('Failed to Fetch trainer');
        }
    }


}

