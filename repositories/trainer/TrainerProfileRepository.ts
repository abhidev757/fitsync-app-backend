import { injectable } from "inversify";
import Trainer from "../../models/TrainerModel";
import { ITrainer } from "../../types/trainer.types";
import { BaseRepository } from "../base/BaseRepository";
import { ITrainerProfileRepository } from "../../interfaces/trainer/repositories/ITrainerProfileRepository";
import { UploadedFile } from "../../types/UploadedFile.types";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

@injectable()
export class TrainerProfileRepository extends BaseRepository<ITrainer> implements ITrainerProfileRepository {
    private readonly TrainerModel = Trainer;

    constructor() { super(Trainer); }

    async findById(id: string): Promise<ITrainer | null> {
        return await this.TrainerModel.findById(id);
    }

    async update(id: string, data: Partial<ITrainer>): Promise<ITrainer | null> {
        return await this.TrainerModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    }

    async uploadCertificate(file: Express.Multer.File): Promise<UploadedFile> {
        return this.uploadToS3(file, 'certificates');
    }

    async uploadProfile(file: Express.Multer.File): Promise<UploadedFile> {
        return this.uploadToS3(file, 'profile-images');
    }

    private async uploadToS3(file: Express.Multer.File, folder: string): Promise<UploadedFile> {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME || "your-default-bucket-name",
            Key: `${folder}/${Date.now().toString()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
        };
        try {
            const command = new PutObjectCommand(params);
            await s3.send(command);
            const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
            return { fileUrl };
        } catch (error) {
            throw new Error("Failed to upload file to S3");
        }
    }
}