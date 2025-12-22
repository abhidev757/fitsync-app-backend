import { inject, injectable } from "inversify";
import { IAuthRepository } from "../../interfaces/user/repositories/IAuthRepository";
import { IUser } from "../../types/user.types";
import { generateOTP, sendOTP } from "../../utils/otpConfig";
import { sendResetEmail } from "../../utils/resetGmail";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

@injectable()
export class AuthService {
  constructor(@inject("IAuthRepository") private authRepository: IAuthRepository) {}

  async authenticateUser(email: string, password: string): Promise<IUser | null> {
    try {
      const user = await this.authRepository.findByEmail(email);
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
    try {
      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000);
      const user = await this.authRepository.createNewData({
        ...userData,
        otp,
        otpExpiresAt,
      });
      if (!user) {
        throw new Error("User registration failed");
      }
      await sendOTP(userData.email, otp);
      return user;
    } catch (err) {
      console.log(err);
      throw new Error("Failed to register User");
    }
  }

  async resendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.authRepository.findByEmail(email);
      if (!user) return { success: false, message: "User not found" };

      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000);

      await this.authRepository.update(user._id.toString(), { otp, otpExpiresAt });
      await sendOTP(email, otp);

      return { success: true, message: "OTP sent successfully" };
    } catch (error) {
      console.log(error);
      return { success: false, message: "Failed to resend OTP" };
    }
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    try {
      const user = await this.authRepository.findByEmail(email);
      if (!user) throw new Error("User not found");
      if (user.otp !== otp) throw new Error("Invalid OTP");
      if (new Date() > user.otpExpiresAt) throw new Error("OTP has expired");

      return true;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to verify OTP");
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.authRepository.findByEmail(email);
      if (!user) throw new Error("User Not Found");

      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h" }
      );
      const expDate = new Date(Date.now() + 3600000);
      await this.authRepository.update(user._id.toString(), {
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
      const user = await this.authRepository.findById(decoded.userId);
      if (!user || user.resetPassword.token !== token)
        throw new Error("Invalid or expired token");
      if (user.resetPassword.expDate && user.resetPassword.expDate < new Date()) {
        throw new Error("Reset token expired");
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.authRepository.update(user._id.toString(), {
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

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.authRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Current password is incorrect");

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.authRepository.updatePassword(userId, hashedPassword);
    return true;
  }

  async getUserById(userId: string): Promise<IUser> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user) {
        throw new Error("user not found");
      }
      return user;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to Fetch user");
    }
  }
}