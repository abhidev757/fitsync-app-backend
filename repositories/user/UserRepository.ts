import { injectable } from "inversify";
import mongoose, { Error } from "mongoose";
import User from "../../models/UserModel";
import {
  CreateBookingDto,
  CreatePaymentDto,
  IPayment,
  IUser,
  IUserProfile,
} from "../../types/user.types";
import { BaseRepository } from "../base/BaseRepository";
import { IUserRepository } from "../../interfaces/user/IUserRepository";
import { IUserFitness } from "../../types/userInfo.types";
import UserFitness from "../../models/UserInfo";
import TrainerModel from "../../models/TrainerModel";
import timeSlotsModel from "../../models/timeSlotsModel";
import { Booking } from "../../models/bookingModel";
import { PaymentModel } from "../../models/PaymentModel";
import { ITrainer } from "../../types/trainer.types";
import { IBooking } from "../../models/bookingModel";
import { ISpecialization } from "../../types/specialization.types";
import Specialization from "../../models/SpecializationModel";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { UploadedFile } from "../../types/UploadedFile.types";
import WalletModel from "../../models/WalletModel";
import UserWalletModel, { IUserWalletTransaction } from "../../models/UserWallet";
import WaterLog, { IWaterLog } from "../../models/WaterLog";
import HealthData from "../../models/HealthDataModel"
import { IFitnessData } from "../../types/fitness.types";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

@injectable()
export class UserRepository
  extends BaseRepository<IUser>
  implements IUserRepository
{
  private readonly UserModel = User;
  private readonly UserFitnessModel = UserFitness;
  private readonly TrainerModel = TrainerModel;
  private readonly TimeSlotsModel = timeSlotsModel;
  private readonly paymentModel = PaymentModel;
  private readonly BookingModel = Booking;
  private readonly SpecializationModel = Specialization;
  private readonly WalletModel = WalletModel;
  private readonly UserWalletModel = UserWalletModel;
  private readonly WaterLogModel = WaterLog;
  private readonly HealthDataModel = HealthData;

  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      return await this.UserModel.findOne({ email });
    } catch (err) {
      console.error("Error finding User by email:", err);
      throw new Error("Failer to find User by email");
    }
  }

  async register(userData: IUser): Promise<IUser | null> {
    try {
      const user = new this.UserModel(userData);
      return await user.save();
    } catch (err) {
      console.error("Error finding User by ID:", err);
      throw new Error("Failed to find User");
    }
  }

  async findById(userId: string): Promise<IUser | null> {
    try {
      return await this.UserModel.findById(userId);
    } catch (error) {
      console.error("Error finding User by ID:", error);
      throw new Error("Failed to find User");
    }
  }

  async update(userId: string, data: Partial<IUser>): Promise<IUser | null> {
    try {
      return await this.UserModel.findByIdAndUpdate(
        userId,
        { $set: data },
        { new: true }
      );
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  }

  async saveFitnessInfo(
    fitnessData: IUserFitness
  ): Promise<IUserFitness | null> {
    try {
      const userFitness = new UserFitness(fitnessData);

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
        profileImageUrl?: string;
      }>();
      console.log("User data from database:", user);

      if (!user) return null;

      // Fetch user fitness data
      const userInfo = await this.UserFitnessModel.findOne({
        userId: token,
      }).lean<{
        age?: number;
        height?: string;
        sex?: string;
        activity?: string;
        weight?: string;
        targetWeight?: string;
        profileImageUrl?: string;
      }>();
      console.log("User fitness data from database:", userInfo);

      // Combine user and userInfo data
      const userProfile: IUserProfile = {
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

  async findAllTrainers(): Promise<ITrainer[]> {
    try {
      return await this.TrainerModel.find({verificationStatus:true}).select(
        "name status yearsOfExperience specializations createdAt profileImageUrl"
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Error fetching users");
    }
  }

  async findTrainerById(userId: string): Promise<ITrainer | null> {
    try {
      const trainer = await this.TrainerModel.findById(userId);
      if (!trainer) return null;

      const timeSlots = await this.TimeSlotsModel.find({ trainerId: userId });

      const trainerWithSlots = trainer.toObject();
      trainerWithSlots.timeSlots = timeSlots;

      return trainerWithSlots;
    } catch (error) {
      console.error("Error finding trainer by ID:", error);
      throw new Error("Failed to find trainer");
    }
  }

  async createPayment(paymentData: CreatePaymentDto): Promise<IPayment> {
    console.log("Creating payment record:", paymentData);
    return this.paymentModel.create(paymentData);
  }

  async findPaymentByStripeId(stripePaymentId: string): Promise<any> {
    return await this.paymentModel.findOne({ stripePaymentId });
  }

  async createBooking(bookingData: CreateBookingDto): Promise<IBooking> {
    console.log("CreateBooking Reached");
    return await this.BookingModel.create(bookingData);
  }

  async findByUserId(userId: string): Promise<IBooking[]> {
    return await this.BookingModel.find({ userId })
      .populate("trainerId")
      .lean()
      .exec();
  }

  async getAllSpecializations(): Promise<ISpecialization[]> {
    try {
      const Specializations = await this.SpecializationModel.find();
      return Specializations;
    } catch (error) {
      console.error("Error fetching specializations:", error);
      throw new Error("Failed to fetch specializations");
    }
  }

  async updatePassword(
    userId: string,
    newHashedPassword: string
  ): Promise<void> {
    try {
      await this.UserModel.findByIdAndUpdate(userId, {
        password: newHashedPassword,
      });
    } catch (error) {
      console.error("Error updating password:", error);
      throw new Error("Failed to update password");
    }
  }

  async uploadProfile(file: Express.Multer.File): Promise<UploadedFile> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME || "your-default-bucket-name",
      Key: `user-profile-images/${Date.now().toString()}-${file.originalname}`,
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

  async updateUserProfilePic(userId: string,fileUrl: string): Promise<IUser | null> {
    try {
      const updatedUser = await this.UserModel.findByIdAndUpdate(
        userId,
        { profileImageUrl: fileUrl },
        { new: true }
      );
      return updatedUser;
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw new Error("Failed to update user profile");
    }
  }

  async creditTrainerWallet(
    trainerId: string,
    amount: number,
    sessionId: string,
    reason: string
  ): Promise<void> {
    await this.TrainerModel.findByIdAndUpdate(trainerId, {
      $inc: { balance: amount },
    });
    await this.WalletModel.create({
      trainerId,
      amount,
      type: "credit",
      sessionId,
      reason,
    });
  }

  async getUserBalance(userId: string): Promise<number> {
    const user = await User.findById(userId);
    return user?.balance ?? 0;
  }

  async getWalletTransactions(userId: string): Promise<IUserWalletTransaction[]> {
    return await this.UserWalletModel.find({ userId }).sort({ createdAt: -1 });
  }

  async findByBookingId(bookingId: string): Promise<IBooking | null> {
    const result = await this.BookingModel.findById(bookingId)
      .populate("userId", "name email phone")
      .populate(
        "trainerId",
        "name email phone profileImageUrl yearsOfExperience"
      )
      .exec();
    return result;
  }

  async updateBookingStatus(bookingId: string,status: string): Promise<IBooking> {
    const updatedBooking = await this.BookingModel.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!updatedBooking) {
      throw new Error("Booking not found");
    }

    return updatedBooking;
  }

  async debit(trainerId: string,amount: number,sessionId: string,reason: string): Promise<void> {
      const trainer = await TrainerModel.findById(trainerId);
      if (!trainer || trainer.balance < amount) {
        throw new Error("Insufficient balance");
      }
  
      await TrainerModel.findByIdAndUpdate(trainerId, { $inc: { balance: -amount } });
  
      await this.WalletModel.create({
        trainerId,
        amount,
        type: "debit",
        sessionId,
        reason,
      });
  
      // 4. Fetch session to get userId
      const session = await this.BookingModel.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }
  
      const userId = session.userId;
  
      // 5. Credit to user
      await this.UserModel.findByIdAndUpdate(userId, { $inc: { balance: amount } });
  
      // 6. Log user credit transaction
      await this.UserWalletModel.create({
        userId,
        amount,
        type: "credit",
        sessionId,
        reason: `Refund: ${reason}`,
      });
    }

    async findWaterLog(userId: string, date: string): Promise<IWaterLog | null > {
      return await this.WaterLogModel.findOne({ userId, date })
    }


    async upsertWaterLog (userId: string, date: string,  waterGlasses: number): Promise<IWaterLog> {
      return await this.WaterLogModel.findOneAndUpdate(
        { userId, date },
        { $set: { waterGlasses } },
        { upsert: true, new: true }
      )
    }

    async saveOrUpdate(userId: string, date: string, data: { steps: number; calories: number; sleepMinutes: number }): Promise<null> {
      return this.HealthDataModel.findOneAndUpdate(
        { userId, date },
        { $set: data },
        { upsert: true, new: true }
      );
    };

    async getByDate(userId: string, date: string):Promise<IFitnessData | null> {
      return this.HealthDataModel.findOne({ userId, date });
    }
  
}
 