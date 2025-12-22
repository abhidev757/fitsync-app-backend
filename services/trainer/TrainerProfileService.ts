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
      const updatedTrainer = await this.trainerProfileRepository.update(
        userId,
        userData
      );
      return { user: updatedTrainer };
    } catch (error) {
      console.error("Error updating trainer data:", error);
      throw new Error("Failed to update profile");
    }
  }

  async uploadCertificate(file: Express.Multer.File): Promise<UploadedFile> {
    try {
      const uploadedFile = await this.trainerProfileRepository.uploadCertificate(file);
      return uploadedFile;
    } catch (error) {
      throw new Error("Failed to upload certificate");
    }
  }

  async uploadProfile(file: Express.Multer.File): Promise<UploadedFile> {
    try {
      const uploadedFile = await this.trainerProfileRepository.uploadProfile(file);
      return uploadedFile;
    } catch (error) {
      throw new Error("Failed to upload certificate");
    }
  }
}