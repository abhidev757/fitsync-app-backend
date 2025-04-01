import { injectable } from "inversify";
import mongoose, { Error } from "mongoose";
import User from "../../models/UserModel";
import { CreateBookingDto, CreatePaymentDto, IPayment, IUser, IUserProfile } from "../../types/user.types";
import { BaseRepository } from "../base/BaseRepository";
import { IUserRepository } from "../../interfaces/user/IUserRepository";
import { IUserFitness } from "../../types/userInfo.types";
import UserFitness from "../../models/UserInfo";
import { HydratedDocument } from "mongoose";
import TrainerModel from "../../models/TrainerModel"
import timeSlotsModel from "../../models/timeSlotsModel"
import { Booking } from "../../models/bookingModel";
import { PaymentModel } from "../../models/PaymentModel";
import { ITrainer } from "../../types/trainer.types";
import { IBooking } from "../../models/bookingModel";




@injectable()
export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
    private readonly UserModel = User;
    private readonly UserFitnessModel = UserFitness;
    private readonly TrainerModel = TrainerModel
    private readonly TimeSlotsModel = timeSlotsModel
    private readonly paymentModel = PaymentModel
    private readonly BookingModel = Booking

    constructor() {
        super(User)
    }

    async findByEmail(email: string): Promise<IUser | null> {
        try{
            return await this.UserModel.findOne({email})
        } catch(err) {
            console.error('Error finding User by email:', err);
            throw new Error('Failer to find User by email')
        }
    }

    async register(userData: IUser): Promise<IUser | null> {
        try {
            const user = new this.UserModel(userData)
            return await user.save();
        } catch(err) {
            console.error('Error finding User by ID:', err);
            throw new Error('Failed to find User')
        }
    }

    async findById(userId: string): Promise<IUser | null> {
        try {
            return await this.UserModel.findById(userId);
        } catch (error) {
            console.error('Error finding User by ID:', error);
            throw new Error('Failed to find User');
        }
    }

    async update(userId: string, data: Partial<IUser>): Promise<IUser | null> {
        try {
            return await this.UserModel.findByIdAndUpdate(userId, { $set: data }, { new: true });
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Error('Failed to update user');
        }
    }

    async saveFitnessInfo(fitnessData: IUserFitness): Promise<IUserFitness | null> {
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
            avatar?: string;
          }>();
          console.log("User data from database:", user);
      
          if (!user) return null;
      
          // Fetch user fitness data
          const userInfo = await this.UserFitnessModel.findOne({ userId: token }).lean<{
            age?: number;
            height?: string;
            sex?: string;
            activity?: string;
            weight?: string;
            targetWeight?: string;
          }>();
          console.log("User fitness data from database:", userInfo);
      
          // Combine user and userInfo data
          const userProfile: IUserProfile = {
            _id: user._id,
            userId: new mongoose.Types.ObjectId(token),
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
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
            return await this.TrainerModel
              .find()
              .select("name status specializations createdAt profileImageUrl");
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
              console.error('Error finding trainer by ID:', error);
              throw new Error('Failed to find trainer');
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
              .populate('trainerId')
              .lean()
              .exec();
          }


}