import { injectable } from "inversify";
import mongoose from "mongoose";
import User from "../../models/UserModel";
import UserFitness from "../../models/UserInfo";
import TrainerModel from "../../models/TrainerModel";
import timeSlotsModel from "../../models/timeSlotsModel";
import Specialization from "../../models/SpecializationModel";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BaseRepository } from "../base/BaseRepository";
import { IUserRepository } from "../../interfaces/user/repositories/IUserRepository";
import { IUser, IUserProfile } from "../../types/user.types";
import { ITrainer } from "../../types/trainer.types";
import { ISpecialization } from "../../types/specialization.types";
import { UploadedFile } from "../../types/UploadedFile.types";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

@injectable()
export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
    private readonly UserModel = User;
    private readonly UserFitnessModel = UserFitness;
    private readonly TrainerModel = TrainerModel;
    private readonly TimeSlotsModel = timeSlotsModel;
    private readonly SpecializationModel = Specialization;

    constructor() { super(User); }

    async findById(userId: string): Promise<IUser | null> {
        return await this.UserModel.findById(userId);
    }

    async update(userId: string, data: Partial<IUser>): Promise<IUser | null> {
        return await this.UserModel.findByIdAndUpdate(userId, { $set: data }, { new: true });
    }

    async findUserProfileById(token: string): Promise<IUserProfile | null> {
        const user = await User.findById(token).select("-password").lean<{ _id: mongoose.Types.ObjectId; name: string; email: string; phone?: string; profileImageUrl?: string; }>();
        if (!user) return null;

        const userInfo = await this.UserFitnessModel.findOne({ userId: token }).lean<{ age?: number; height?: string; sex?: string; activity?: string; weight?: string; targetWeight?: string; profileImageUrl?: string; }>();

        return {
            _id: user._id,
            userId: new mongoose.Types.ObjectId(token),
            name: user.name,
            email: user.email,
            phone: user.phone,
            profileImageUrl: user.profileImageUrl,
            age: userInfo?.age || 0,
            height: userInfo?.height || "N/A",
            sex: userInfo?.sex || "N/A",
            activity: userInfo?.activity || "N/A",
            weight: userInfo?.weight || "N/A",
            targetWeight: userInfo?.targetWeight || "N/A",
        };
    }

    async findAllTrainers(): Promise<ITrainer[]> {
        return await this.TrainerModel.find({ verificationStatus: true }).select("name status yearsOfExperience specializations createdAt profileImageUrl");
    }

    async findTrainerById(userId: string): Promise<ITrainer | null> {
        const trainer = await this.TrainerModel.findById(userId);
        if (!trainer) return null;
        const timeSlots = await this.TimeSlotsModel.find({ trainerId: userId });
        const trainerWithSlots = trainer.toObject();
        trainerWithSlots.timeSlots = timeSlots;
        return trainerWithSlots;
    }

    async getAllSpecializations(): Promise<ISpecialization[]> {
        return await this.SpecializationModel.find();
    }

    async uploadProfile(file: Express.Multer.File): Promise<UploadedFile> {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME || "your-default-bucket-name",
            Key: `user-profile-images/${Date.now().toString()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
        };
        const command = new PutObjectCommand(params);
        await s3.send(command);
        const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
        return { fileUrl };
    }

    async updateUserProfilePic(userId: string, fileUrl: string): Promise<IUser | null> {
        return await this.UserModel.findByIdAndUpdate(userId, { profileImageUrl: fileUrl }, { new: true });
    }
}