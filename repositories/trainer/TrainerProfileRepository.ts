import { injectable } from "inversify";
import mongoose from "mongoose";
import Trainer from "../../models/TrainerModel";
import { ITrainer } from "../../types/trainer.types";
import { BaseRepository } from "../base/BaseRepository";
import { ITrainerProfileRepository } from "../../interfaces/trainer/repositories/ITrainerProfileRepository";
import { UploadedFile } from "../../types/UploadedFile.types";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import Specialization from "../../models/SpecializationModel";
import { Booking } from "../../models/bookingModel";

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

    async uploadAndSaveProfile(file: Express.Multer.File, trainerId: string): Promise<{ fileUrl: string }> {
        const uploaded = await this.uploadToS3(file, 'profile-images');
        await this.TrainerModel.findByIdAndUpdate(trainerId, { profileImageUrl: uploaded.fileUrl });
        return { fileUrl: uploaded.fileUrl };
    }

    async getSpecializations(): Promise<{ _id: string; name: string }[]> {
        const specs = await Specialization.find({ isBlock: false }).select('_id name').lean();
        return specs.map((s: any) => ({ _id: s._id.toString(), name: s.name }));
    }

    async getPerformanceStats(trainerId: string): Promise<{ labels: string[]; data: number[] }> {
        const trainerObjId = new mongoose.Types.ObjectId(trainerId);
        const now = new Date();

        const months: { start: Date; end: Date; label: string }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            months.push({ start: d, end, label: d.toLocaleString('default', { month: 'short' }) });
        }

        const agg = await Booking.aggregate([
            {
                $match: {
                    trainerId: trainerObjId,
                    status: 'completed',
                    createdAt: { $gte: months[0].start },
                },
            },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
        ]);

        const dataArr = Array(6).fill(0);
        for (const item of agg) {
            const itemDate = new Date(item._id.year, item._id.month - 1, 1);
            months.forEach((m, idx) => {
                if (itemDate >= m.start && itemDate < m.end) dataArr[idx] = item.count;
            });
        }

        return { labels: months.map(m => m.label), data: dataArr };
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