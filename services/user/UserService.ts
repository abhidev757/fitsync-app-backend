import { inject, injectable } from "inversify";
import { IUserService } from "../../interfaces/user/IUserService";
import { IUserRepository } from "../../interfaces/user/IUserRepository";
import {
  IUser,
  IBlockedUserResponse,
  IUnblockedUserResponse,
  IUserProfile,
} from "../../types/user.types";
import { generateOTP, sendOTP } from "../../utils/otpConfig";
import { sendResetEmail } from "../../utils/resetGmail";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { IUserFitness } from "../../types/userInfo.types";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}
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
  

  async getUserProfile(token: string):Promise<IUserProfile | null> {
      console.log('serviceeee')
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

    const updatedFitness = await this.userRepository.updateFitnessInfo(userId, fitnessData);

    return { user: updatedUser, fitness: updatedFitness };
  } catch (error) {
    console.error("Error updating user and fitness data:", error);
    throw new Error("Failed to update profile");
  }
}
}
