import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { IUserService } from "../../interfaces/user/IUserService";
import { HttpStatusCode } from "../../enums/HttpStatusCode";
import { StatusMessage } from "../../enums/StatusMessage";
import { inject, injectable } from "inversify";
import UserTokenService from "../../utils/UserTokenService";
import { GoogleAuthService } from "../../services/user/GoogleAuthService";
import TokenService from "../../utils/TokenService";
import { IUserFitness } from "../../types/userInfo.types";
import mongoose from "mongoose";
import { PaymentIntentMetadata } from "../../types/user.types";
import Stripe from "stripe";
import jwt from "jsonwebtoken";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

interface AuthenticatedRequest extends Request {
  user?: any;
}

@injectable()
export class UserController {
  constructor(
    @inject("IUserService") private readonly userService: IUserService
  ) {}

  authUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await this.userService.authenticateUser(email, password);
      if (!user) {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: StatusMessage.NOT_FOUND });
        return;
      }
      if (user.status === false) {
        res
          .status(HttpStatusCode.FORBIDDEN)
          .json({ message: StatusMessage.ACCOUNT_BLOCKED });
        return;
      }
      const accessToken = UserTokenService.generateAccessToken(
        user._id.toString(),
        user.role
      );
      const refreshToken = UserTokenService.generateRefreshToken(
        user._id.toString(),
        user.role
      );
      UserTokenService.setTokenCookies(res, accessToken, refreshToken);
      res.status(HttpStatusCode.OK).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: accessToken,
      });
    } catch (err) {
      console.log(err);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  logoutUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      res.cookie("accessToken", "", {
        httpOnly: true,
        expires: new Date(0),
      });
      res.cookie("refreshToken", "", {
        httpOnly: true,
        expires: new Date(0),
      });
      res.status(HttpStatusCode.OK).json({ message: StatusMessage.SUCCESS });
    } catch (err) {
      console.log(err);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    console.log("Refresh Token:", refreshToken);

    if (!refreshToken) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }
    const decoded = UserTokenService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }
    const user = await this.userService.getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: "User is not found" });
      return;
    }
    const newAccessToken = UserTokenService.generateAccessToken(
      user._id.toString(),
      user.role
    );
    UserTokenService.setTokenCookies(res, newAccessToken, refreshToken);
    res.status(200).json({ message: "Token refreshed successfully" });
  });

  registerUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      const userExist = await this.userService.authenticateUser(
        email,
        password
      );
      if (userExist) {
        res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ message: StatusMessage.BAD_REQUEST });
        return;
      }
      const user = await this.userService.registerUser({
        name,
        email,
        password,
      });
      res.status(HttpStatusCode.CREATED).json(user);
    } catch (err) {
      console.log(err);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { emailId, otp } = req.body;
    if (!emailId || !otp) {
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: StatusMessage.BAD_REQUEST });
      return;
    }

    try {
      const isVerified = await this.userService.verifyOTP(emailId, otp);
      res.status(HttpStatusCode.OK).json({ success: isVerified });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ success: false, message: StatusMessage.BAD_REQUEST });
    }
  });

  resendOTP = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { emailId } = req.body;
      if (!emailId) {
        res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ message: StatusMessage.BAD_REQUEST });
        return;
      }
      const result = await this.userService.resendOTP(emailId);
      res
        .status(result.success ? HttpStatusCode.OK : HttpStatusCode.BAD_REQUEST)
        .json(result);
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  saveUserFitnessInfo = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId, sex, age, height, weight, targetWeight, activity } =
        req.body;
      if (!userId) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      const fitnessData: IUserFitness = {
        userId,
        sex,
        age,
        height,
        weight,
        targetWeight,
        activity,
      };
      await this.userService.saveFitnessInfo(fitnessData);

      res.status(201).json({ message: "Fitness data saved successfully" });
    } catch (error) {
      console.error("Error saving fitness data:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: StatusMessage.BAD_REQUEST });
      return;
    }

    try {
      await this.userService.requestPasswordReset(email);
      res.status(HttpStatusCode.OK).json({ message: StatusMessage.SUCCESS });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: StatusMessage.BAD_REQUEST });
    }
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
      await this.userService.resetPassword(token, password);
      res.status(HttpStatusCode.OK).json({ message: StatusMessage.SUCCESS });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  googleAuth = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;
      const googleAuthService = new GoogleAuthService();
      const payload = await googleAuthService.verifyGoogleToken(credential);
      if (!payload) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          message: "Invalid Google token",
        });
        return;
      }

      const user = await googleAuthService.findOrCreateUser(payload);

      if (!user.status) {
        res.status(HttpStatusCode.FORBIDDEN).json({
          message: StatusMessage.ACCOUNT_BLOCKED,
        });
        return;
      }
      const accessToken = TokenService.generateAccessToken(
        user._id.toString(),
        user.role
      );
      const refreshToken = TokenService.generateRefreshToken(
        user._id.toString(),
        user.role
      );

      TokenService.setTokenCookies(res, accessToken, refreshToken);

      res.status(HttpStatusCode.OK).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isGoogleLogin: user.isGoogleLogin,
      });
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        message: StatusMessage.INTERNAL_SERVER_ERROR,
      });
    }
  });

  getUserDetails = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        

        const token = req.params.token;
        
        const userProfile = await this.userService.getUserProfile(token);
        

        if (!userProfile) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        res.status(200).json(userProfile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Failed to fetch user profile" });
      }
    }
  );

  userEditProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { userData, fitnessData } = req.body;

      if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
      }

      const updatedProfile = await this.userService.updateUserAndFitness(
        userId,
        userData,
        fitnessData
      );

      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedProfile.user,
        fitness: updatedProfile.fitness,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  getAllTrainers = asyncHandler(async (req: Request, res: Response) => {
    try {
      const trainers = await this.userService.getAllTrainers();
      res.status(HttpStatusCode.OK).json(trainers);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  getTrainer = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const trainerProfile = await this.userService.getTrainer(userId);

      if (!trainerProfile) {
        res.status(404).json({ message: "Trainer not found" });
        return;
      }

      res.status(200).json(trainerProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trainer " });
    }
  });

  createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId, amount, trainerId, sessionTime, startDate, isPackage } =
        req.body;
      console.log(`UserId:${userId},TrainerId:${trainerId}`);

      const metadata: PaymentIntentMetadata = {
        userId,
        trainerId,
        sessionTime,
        startDate,
        isPackage: isPackage.toString(),
      };

      const paymentIntent = await this.userService.createPaymentIntent(
        amount,
        trainerId,
        metadata
      );

      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Payment intent error:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  createBooking = asyncHandler(async (req: Request, res: Response) => {
    try {
      const bookingData = req.body;
      const booking = await this.userService.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      console.log("Error creating Booking", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  getUserBookings = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const Bookings = await this.userService.getUserBookings(userId);

      if (!Bookings) {
        res.status(404).json({ message: "Bookings not found" });
        return;
      }

      res.status(200).json(Bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Bookings " });
    }
  });

  getAllSpecializations = asyncHandler(async (req: Request, res: Response) => {
    try {
      const specializations = await this.userService.getAllSpecializations();
      res.status(HttpStatusCode.OK).json(specializations);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    try {
      const result = await this.userService.changePassword(
        userId,
        currentPassword,
        newPassword
      );
      res.status(HttpStatusCode.OK).json({
        success: result,
        message: result
          ? "Password changed successfully"
          : "Unable to change password",
      });
    } catch (error: any) {
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: error.message || "Error changing password" });
    }
  });

  uploadProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }
      const userId = req.params.userId;
      if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
      }

      try {
        const uploadedFile = await this.userService.uploadProfile(
          req.file,
          userId
        );
        res
          .status(200)
          .json({ success: true, avatarUrl: uploadedFile.fileUrl });
      } catch (error) {
        res.status(500).json({ message: "File upload failed" });
      }
    }
  );

  getWalletDetails = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    const walletData = await this.userService.getWalletDetails(userId);
    

    res.json(walletData);
  });

  getBookingDetails = asyncHandler(async (req: Request, res: Response) => {
    try {
      const bookingId = req.params.id;
      const Bookings = await this.userService.getBookingDetails(bookingId);
      

      if (!Bookings) {
        res.status(404).json({ message: "Bookings not found" });
        return;
      }

      res.status(200).json(Bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Bookings " });
    }
  });

  cancelBookingByuser = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.params;

    try {
      const cancelledBooking = await this.userService.cancelBookingByUser(
        bookingId
      );
      res.status(200).json({
        message: "Booking cancelled successfully",
        booking: cancelledBooking,
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  getWater = asyncHandler(async (req: Request, res: Response) => {
    const { userId, date } = req.query as { userId: string; date: string };

    if (!userId || !date) {
      res.status(400).json({ message: "userId and date are required" });
      return;
    }

    try {
      const log = await this.userService.getWaterLog(userId, date);
      res.json({ waterGlasses: log?.waterGlasses || 0 });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get water data" });
    }
  });

  updateWater = asyncHandler(async (req: Request, res: Response) => {
    const { userId, date, waterGlasses } = req.body;

    if (!userId || !date || waterGlasses === undefined) {
      res
        .status(400)
        .json({ message: "userId, date, and waterGlasses are required" });
      return;
    }

    try {
      const log = await this.userService.saveWaterLog(
        userId,
        date,
        waterGlasses
      );
      res.json({ message: "Water data updated", data: log });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update water data" });
    }
  });

  syncGoogleFitData = asyncHandler(async (req: Request, res: Response) => {
    const { accessToken, userId } = req.body;
    if (!accessToken || !userId) {
      res.status(400).json({ message: "accessToken and userId required" });
      return;
    }

    try {
      const data = await this.userService.fetchAndSaveGoogleFitData(
        userId,
        accessToken
      );
      res.status(200).json({ message: "Synced", data });
    } catch (err) {
      console.error("Error syncing Google Fit data:", err);
      res.status(500).json({ message: "Failed to sync data" });
    }
  });

  getTodayHealthData = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query;

    if (!userId) {
      res.status(400).json({ message: "userId required" });
      return;
    }

    try {
      const data = await this.userService.getTodayData(userId as string);
      console.log("fitness dataaaaaaaa: ",data);
      
      res.status(200).json(data);
    } catch (err) {
      console.error("Error fetching health data:", err);
      res.status(500).json({ message: "Failed to fetch data" });
    }
  });

  googleAuthCode = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      // console.log("UserId", req.user._id);
      const { code, redirectUri } = req.body;
      const googleAuthService = new GoogleAuthService();
      if (!code || !redirectUri) {
        res.status(400).json({ message: "code and redirectUri required" });
        return;
      }

      // delegate all Google Fit token logic to the service
      await googleAuthService.exchangeCodeAndSaveFitTokens(
        code,
        req.user._id,
        redirectUri
      );

      res.json({ message: "Google Fit connected" });
    }
  );

  syncGoogleFit = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user._id; // set by userProtect middleware
      // console.log("UserId:", userId);

      const googleAuthService = new GoogleAuthService();
      try {
        // Delegate the fetch-and-save logic to the service
        const updatedRecord = await googleAuthService.fetchAndSaveGoogleFitData(
          userId
        );
        
        res.status(200).json({
          message: "Google Fit data synced",
          data: updatedRecord,
        });
      } catch (err) {
        console.error("Error syncing Google Fit data:", err);
        res.status(500).json({ message: "Failed to sync Google Fit data" });
      }
    }
  );
}
