import { inject, injectable } from "inversify";
import { ITrainerProfileRepository } from "../../interfaces/trainer/repositories/ITrainerProfileRepository";
import { ITrainer, ITrainerProfile } from "../../types/trainer.types";
import { UploadedFile } from "../../types/UploadedFile.types";

@injectable()
export class TrainerProfileService {
  constructor(
    @inject("ITrainerProfileRepository") private trainerProfileRepository: ITrainerProfileRepository
  ) {}

  async getTrainerProfile(userId: string): Promise<ITrainerProfile | null> {
    try {
      const trainerProfile = await this.trainerProfileRepository.findById(userId);
      return trainerProfile;
    } catch (error) {
      throw new Error("Failed to fetch trainer profile");
    }
  }

  async updateTrainerProfile(
    userId: string,
    userData: Partial<ITrainer>
  ): Promise<{ user: ITrainer | null }> {
    try {
      const updatedTrainer = await this.trainerProfileRepository.update(userId, userData);
      return { user: updatedTrainer };
    } catch (error) {
      console.error("Error updating trainer data:", error);
      throw new Error("Failed to update profile");
    }
  }

  async uploadCertificate(file: Express.Multer.File): Promise<UploadedFile> {
    try {
      return await this.trainerProfileRepository.uploadCertificate(file);
    } catch (error) {
      throw new Error("Failed to upload certificate");
    }
  }

  async uploadProfile(file: Express.Multer.File): Promise<UploadedFile> {
    try {
      return await this.trainerProfileRepository.uploadProfile(file);
    } catch (error) {
      throw new Error("Failed to upload profile image");
    }
  }

  async uploadAndSaveProfile(file: Express.Multer.File, trainerId: string): Promise<{ fileUrl: string }> {
    return this.trainerProfileRepository.uploadAndSaveProfile(file, trainerId);
  }

  async getSpecializations(): Promise<{ _id: string; name: string }[]> {
    return this.trainerProfileRepository.getSpecializations();
  }

  async getPerformanceStats(trainerId: string): Promise<{ labels: string[]; data: number[] }> {
    return this.trainerProfileRepository.getPerformanceStats(trainerId);
  }
}