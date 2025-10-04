import { inject, injectable } from "inversify";
import { IUserService } from "../../interfaces/user/IUserService";
import { IUserRepository } from "../../interfaces/user/IUserRepository";
import {
  IUser,
  IUserProfile,
  CreateBookingDto,
  PaymentIntentMetadata,
} from "../../types/user.types";
import { generateOTP, sendOTP } from "../../utils/otpConfig";
import { sendResetEmail } from "../../utils/resetGmail";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { IUserFitness } from "../../types/userInfo.types";
import { ITrainer, ITrainerProfile, UserWalletDetails } from "../../types/trainer.types";
import Stripe from "stripe";
import { IBooking } from "../../models/bookingModel";
import mongoose from "mongoose";
import { ISpecialization } from "../../types/specialization.types";
import { UploadedFile } from "../../types/UploadedFile.types";
import { IWaterLog } from "../../models/WaterLog";
import { google, fitness_v1 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import { IFitnessData } from "../../types/fitness.types";

const SALT_ROUNDS = 10;

@injectable()
export class UserService implements IUserService {
  private stripe: Stripe;
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("StripeSecretKey") private readonly stripeSecretKey: string,
    @inject("StripeConfig") private readonly config: Stripe.StripeConfig
  ) {
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }
    this.stripe = new Stripe(stripeSecretKey, config);
  }

  async authenticateUser(
    email: string,
    password: string
  ): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (user && (await user.matchPassword(password))) {
        return user;
      }
      return null;
    } catch (err) {
      console.log(err);
      throw new Error("Failed to authenticate User");
    }
  }

  async registerUser(userData: IUser): Promise<IUser | null> {
    let dataToUpdate: Partial<IUser> | null = null;
    try {
      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000);
      const user = await this.userRepository.createNewData({
        ...userData,
        otp,
        otpExpiresAt,
      });
      if (!user) {
        throw new Error("User registeration failed");
      }
      await sendOTP(userData.email, otp);
      if (dataToUpdate) {
        await this.userRepository.updateOneById(
          user._id.toString(),
          dataToUpdate
        );
      }
      return user;
    } catch (err) {
      console.log(err);
      throw new Error("Failed to register User");
    }
  }

  async getUserById(userId: string): Promise<IUser> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("user not found");
      }
      return user;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to Fetch user");
    }
  }

  async resendOTP(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return { success: false, message: "User not found" };
      }

      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000);

      await this.userRepository.update(user._id.toString(), {
        otp,
        otpExpiresAt,
      });
      await sendOTP(email, otp);

      return { success: true, message: "OTP sent successfully" };
    } catch (error) {
      console.log(error);
      return { success: false, message: "Failed to resend OTP" };
    }
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.otp !== otp) {
        throw new Error("Invalid OTP");
      }

      if (new Date() > user.otpExpiresAt) {
        throw new Error("OTP has expired");
      }

      return true;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to verify OTP");
    }
  }

  async saveFitnessInfo(
    fitnessData: IUserFitness
  ): Promise<IUserFitness | null> {
    try {
      return await this.userRepository.saveFitnessInfo(fitnessData);
    } catch (error) {
      console.error("Error saving user fitness info:", error);
      throw new Error("Failed to save fitness info");
    }
  }

  async getFitnessInfo(userId: string): Promise<IUserFitness> {
    try {
      const fitnessInfo = await this.userRepository.getFitnessInfo(userId);
      if (!fitnessInfo) throw new Error("Fitness info not found");
      return fitnessInfo;
    } catch (error) {
      console.error("Error retrieving user fitness info:", error);
      throw new Error("Failed to retrieve fitness info");
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) throw new Error("User Not Found");

      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h" }
      );
      const expDate = new Date(Date.now() + 3600000);
      await this.userRepository.update(user._id.toString(), {
        resetPassword: {
          token: resetToken,
          expDate,
          lastResetDate: new Date(),
        },
      });

      const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      await sendResetEmail(user.email, resetLink);
    } catch (error) {
      console.log(error);
      throw new Error("Failed to request password reset");
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || user.resetPassword.token !== token)
        throw new Error("Invalid or expired token");
      if (
        user.resetPassword.expDate &&
        user.resetPassword.expDate < new Date()
      ) {
        throw new Error("Reset token expired");
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.update(user._id.toString(), {
        password: hashedPassword,
        resetPassword: {
          ...user.resetPassword,
          lastResetDate: new Date(),
          token: null,
          expDate: null,
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to reset password");
    }
  }

  async getUserProfile(token: string): Promise<IUserProfile | null> {
    console.log("serviceeee");
    try {
      const userProfile = await this.userRepository.findUserProfileById(token);
      return userProfile;
    } catch (error) {
      throw new Error("Failed to fetch user profile");
    }
  }

  async updateUserAndFitness(
    userId: string,
    userData: Partial<IUser>,
    fitnessData: Partial<IUserFitness>
  ): Promise<{ user: IUser | null; fitness: IUserFitness | null }> {
    try {
      const updatedUser = await this.userRepository.update(userId, userData);

      const updatedFitness = await this.userRepository.updateFitnessInfo(
        userId,
        fitnessData
      );

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

  async createPaymentIntent(
    amount: number,
    trainerId: string,
    metadata: PaymentIntentMetadata
  ): Promise<Stripe.PaymentIntent> {
    const userId = new mongoose.Types.ObjectId(metadata.userId);
    const trainerObjectId = new mongoose.Types.ObjectId(trainerId);

    const dbPayment = await this.userRepository.createPayment({
      userId,
      trainerId: trainerObjectId,
      amount: amount,
      currency: "usd",
      status: "requires_payment_method",
      metadata,
      stripePaymentId: "temp_" + new Date().getTime(),
    });

    const stripePI = await this.stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        ...metadata,
        internalPaymentId: dbPayment._id.toString(),
      },
    });

    return stripePI;
  }

  async createBooking(bookingData: any): Promise<IBooking> {
    try {
      const validatedData = {
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        userId: bookingData.user || bookingData.userId,
        trainerId: bookingData.trainer || bookingData.trainerId,
        sessionTime: bookingData.sessionTime,
        startDate: bookingData.startDate,
        isPackage: bookingData.isPackage,
        paymentId: bookingData.paymentId,
        amount: bookingData.amount,
        status: "confirmed" as const,
      };

      if (!validatedData.userId || !validatedData.trainerId) {
        throw new Error("Missing required fields: userId or trainerId");
      }

      const processedData: CreateBookingDto = {
        ...validatedData,
        userId: new mongoose.Types.ObjectId(validatedData.userId),
        trainerId: new mongoose.Types.ObjectId(validatedData.trainerId),
        status: validatedData.status,
      };

      console.log("Processed booking data:", processedData);

      const booking = await this.userRepository.createBooking(processedData);
      
      await this.userRepository.creditTrainerWallet(
        processedData.trainerId.toString(),
        processedData.amount,
        booking._id.toString(),
        'Session Booked'
      );  
      return booking.toObject();
    } catch (error) {
      console.error("Error creating booking:", error);
      throw new Error("Failed to create booking");
    }
  }

  async getUserBookings(userId: string): Promise<IBooking[]> {
    try {
      const bookings = await this.userRepository.findByUserId(userId);
      return bookings.map((booking) => booking);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      throw new Error("Failed to fetch user bookings");
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

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
   
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }


    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    
    await this.userRepository.updatePassword(userId, hashedPassword);
    return true;
  }

  async uploadProfile(file: Express.Multer.File,userId: string): Promise<UploadedFile> {
    try {
      const uploadedFile = await this.userRepository.uploadProfile(file);
      await this.userRepository.updateUserProfilePic(userId, uploadedFile.fileUrl);
      return uploadedFile;
    } catch (error) {
      throw new Error("Failed to upload certificate");
    }
  }

  async getWalletDetails(userId: string): Promise<UserWalletDetails>{
      const [balance, transactions] = await Promise.all([
        this.userRepository.getUserBalance(userId),
        this.userRepository.getWalletTransactions(userId),
      ]);
    
      return {
        balance,
        transactions,
      };
    };


    async getBookingDetails(bookingId: string): Promise<IBooking | null> {
      try {
        const booking = await this.userRepository.findByBookingId(bookingId);
        if (!booking) {
          throw new Error("Booking not found");
        }
        return booking;
      } catch (error) {
        console.error("Error fetching booking details:", error);
        throw new Error("Failed to fetch booking details");
      }
    };

    async cancelBookingByUser(bookingId: string): Promise<IBooking> {
        try {
          // Get booking details
          const booking = await this.userRepository.findByBookingId(bookingId);
          if (!booking) {
            throw new Error("Booking not found");
          }
    
          if (booking.status === "cancelled") {
            throw new Error("Booking already cancelled");
          }
    
          // Update booking status
          const updatedBooking = await this.userRepository.updateBookingStatus(
            bookingId,
            "cancelled"
          );
    
          // Debit trainer wallet
    
          const trainerId =
            typeof booking.trainerId === "object"
              ? (
                  booking.trainerId as { _id: mongoose.Types.ObjectId }
                )._id.toString()
              : (booking.trainerId as mongoose.Types.ObjectId).toString();
    
              await this.userRepository.debit(
                trainerId,
                booking.amount,
                booking._id.toString(),
                "Session Cancelled"
              );
    
          return updatedBooking;
        } catch (error) {
          console.error("Error cancelling booking:", error);
          throw new Error("Failed to cancel booking");
        }
      }

      async getWaterLog (userId: string, date: string): Promise<IWaterLog | null>{
        return await this.userRepository.findWaterLog(userId, date)
      };

      async saveWaterLog  (userId: string, date: string, waterGlasses: number): Promise<IWaterLog>{
        return await this.userRepository.upsertWaterLog(userId, date, waterGlasses)
      };

      async fetchAndSaveGoogleFitData(userId: string, accessToken: string):Promise<null> {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
      
        const fitness = google.fitness({ version: 'v1', auth: oauth2Client });
      
        const now = Date.now();
        const start = now - 24 * 60 * 60 * 1000;
      
        const params: fitness_v1.Params$Resource$Users$Dataset$Aggregate = {
          userId: 'me',
          requestBody: {
            aggregateBy: [
              { dataTypeName: 'com.google.step_count.delta' },
              { dataTypeName: 'com.google.calories.expended' },
              { dataTypeName: 'com.google.sleep.segment' },
            ],
            bucketByTime: { durationMillis: `${86_400_000}` },
            startTimeMillis: `${start}`,
            endTimeMillis: `${now}`,
          },
        };
      
        const response: GaxiosResponse<fitness_v1.Schema$AggregateResponse> =
          await fitness.users.dataset.aggregate(params);
      
        const buckets = response.data.bucket ?? [];
      
        let steps = 0, calories = 0, sleepMinutes = 0;
        for (const bucket of buckets) {
          for (const dataset of bucket.dataset || []) {
            for (const point of dataset.point || []) {
              switch (point.dataTypeName) {
                case 'com.google.step_count.delta':
                  steps += point.value?.[0]?.intVal || 0;
                  break;
                case 'com.google.calories.expended':
                  calories += point.value?.[0]?.fpVal || 0;
                  break;
                case 'com.google.sleep.segment':
                  sleepMinutes +=
                    (Number(point.endTimeNanos) - Number(point.startTimeNanos)) /
                    1e9 /
                    60;
                  break;
              }
            }
          }
        }
      
        const date = new Date().toISOString().slice(0, 10);
        return this.userRepository.saveOrUpdate(userId, date, {
          steps,
          calories,
          sleepMinutes,
        });
      };
    
      async getTodayData(userId: string):Promise<IFitnessData|null> {
        const today = new Date().toISOString().slice(0, 10);
        return this.userRepository.getByDate(userId, today);
      }


}
