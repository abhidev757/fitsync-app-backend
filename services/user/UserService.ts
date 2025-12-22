import { inject, injectable } from "inversify";
import { IUserRepository } from "../../interfaces/user/repositories/IUserRepository";
import { IFitnessRepository } from "../../interfaces/user/repositories/IFitnessRepository";
import { IUser, IUserProfile } from "../../types/user.types";
import { IUserFitness } from "../../types/userInfo.types";
import { ITrainer, ITrainerProfile } from "../../types/trainer.types";
import { ISpecialization } from "../../types/specialization.types";
import { UploadedFile } from "../../types/UploadedFile.types";

@injectable()
export class UserService {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IFitnessRepository") private fitnessRepository: IFitnessRepository
  ) {}

  async getUserById(userId: string): Promise<IUser> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error("user not found");
      return user;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to Fetch user");
    }
  }

  async getUserProfile(token: string): Promise<IUserProfile | null> {
    try {
      const userProfile = await this.userRepository.findUserProfileById(token);
      return userProfile;
    } catch (error) {
      throw new Error("Failed to fetch user profile");
    }
  }

  async updateUserAndFitness(userId: string, userData: Partial<IUser>, fitnessData: Partial<IUserFitness>): Promise<{ user: IUser | null; fitness: IUserFitness | null }> {
    try {
      const updatedUser = await this.userRepository.update(userId, userData);
      const updatedFitness = await this.fitnessRepository.updateFitnessInfo(userId, fitnessData);
      return { user: updatedUser, fitness: updatedFitness };
    } catch (error) {
      console.error("Error updating user and fitness data:", error);
      throw new Error("Failed to update profile");
    }
  }

  async getAllTrainers(): Promise<ITrainer[]> {
    try {
      return await this.userRepository.findAllTrainers();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to retrieve trainers");
    }
  }

  async getTrainer(userId: string): Promise<ITrainerProfile | null> {
    try {
      const trainerProfile = await this.userRepository.findTrainerById(userId);
      return trainerProfile;
    } catch (error) {
      throw new Error("Failed to fetch trainer profile");
    }
  }

  async getAllSpecializations(): Promise<ISpecialization[]> {
    try {
      return await this.userRepository.getAllSpecializations();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to retrieve Specializations");
    }
  }

  async uploadProfile(file: Express.Multer.File, userId: string): Promise<UploadedFile> {
    try {
      const uploadedFile = await this.userRepository.uploadProfile(file);
      await this.userRepository.updateUserProfilePic(userId, uploadedFile.fileUrl);
      return uploadedFile;
    } catch (error) {
      throw new Error("Failed to upload certificate");
    }
  }
}