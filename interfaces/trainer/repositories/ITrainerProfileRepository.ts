import { ITrainer } from "../../../types/trainer.types";
import { UploadedFile } from "../../../types/UploadedFile.types";

export interface ITrainerProfileRepository {
    findById(id: string): Promise<ITrainer | null>;
    update(id: string, data: Partial<ITrainer>): Promise<ITrainer | null>;
    uploadCertificate(file: Express.Multer.File): Promise<UploadedFile>;
    uploadProfile(file: Express.Multer.File): Promise<UploadedFile>;
}