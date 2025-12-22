import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { inject, injectable } from "inversify";
import { IAuthService } from "../../interfaces/user/services/IAuthService";
import { HttpStatusCode } from "../../enums/HttpStatusCode";
import { StatusMessage } from "../../enums/StatusMessage";
import UserTokenService from "../../utils/UserTokenService";
import { GoogleAuthService } from "../../services/user/GoogleAuthService";
import TokenService from "../../utils/TokenService";

@injectable()
export class AuthController {
  constructor(@inject("IAuthService") private readonly authService: IAuthService) {}

  authUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await this.authService.authenticateUser(email, password);
      
      if (!user) {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: StatusMessage.NOT_FOUND });
        return;
      }
      if (user.status === false) {
        res.status(HttpStatusCode.FORBIDDEN).json({ message: StatusMessage.ACCOUNT_BLOCKED });
        return;
      }

      const accessToken = UserTokenService.generateAccessToken(user._id.toString(), user.role);
      const refreshToken = UserTokenService.generateRefreshToken(user._id.toString(), user.role);
      
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
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  registerUser = asyncHandler(async (req: Request, res: Response) => {
     try {
       const { name, email, password } = req.body;
       const userExist = await this.authService.authenticateUser(email, password);
       if (userExist) {
         res.status(HttpStatusCode.BAD_REQUEST).json({ message: StatusMessage.BAD_REQUEST });
         return;
       }
       const user = await this.authService.registerUser({ name, email, password });
       res.status(HttpStatusCode.CREATED).json(user);
     } catch (err) {
       console.log(err);
       res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
     }
  });

  logoutUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      res.cookie("accessToken", "", { httpOnly: true, expires: new Date(0) });
      res.cookie("refreshToken", "", { httpOnly: true, expires: new Date(0) });
      res.status(HttpStatusCode.OK).json({ message: StatusMessage.SUCCESS });
    } catch (err) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }
    const decoded = UserTokenService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }
    const user = await this.authService.getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: "User is not found" });
      return;
    }
    const newAccessToken = UserTokenService.generateAccessToken(user._id.toString(), user.role);
    UserTokenService.setTokenCookies(res, newAccessToken, refreshToken);
    res.status(200).json({ message: "Token refreshed successfully" });
  });

  verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { emailId, otp } = req.body;
    if (!emailId || !otp) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ message: StatusMessage.BAD_REQUEST });
      return;
    }
    try {
      const isVerified = await this.authService.verifyOTP(emailId, otp);
      res.status(HttpStatusCode.OK).json({ success: isVerified });
    } catch (error) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: StatusMessage.BAD_REQUEST });
    }
  });

  resendOTP = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { emailId } = req.body;
      if (!emailId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: StatusMessage.BAD_REQUEST });
        return;
      }
      const result = await this.authService.resendOTP(emailId);
      res.status(result.success ? HttpStatusCode.OK : HttpStatusCode.BAD_REQUEST).json(result);
    } catch (error) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  googleAuth = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;
      const googleAuthService = new GoogleAuthService();
      const payload = await googleAuthService.verifyGoogleToken(credential);
      if (!payload) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ message: "Invalid Google token" });
        return;
      }

      const user = await googleAuthService.findOrCreateUser(payload);
      if (!user.status) {
        res.status(HttpStatusCode.FORBIDDEN).json({ message: StatusMessage.ACCOUNT_BLOCKED });
        return;
      }
      
      const accessToken = TokenService.generateAccessToken(user._id.toString(), user.role);
      const refreshToken = TokenService.generateRefreshToken(user._id.toString(), user.role);
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
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ message: StatusMessage.BAD_REQUEST });
      return;
    }
    try {
      await this.authService.requestPasswordReset(email);
      res.status(HttpStatusCode.OK).json({ message: StatusMessage.SUCCESS });
    } catch (error) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ message: StatusMessage.BAD_REQUEST });
    }
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
      await this.authService.resetPassword(token, password);
      res.status(HttpStatusCode.OK).json({ message: StatusMessage.SUCCESS });
    } catch (error) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    try {
      const result = await this.authService.changePassword(userId, currentPassword, newPassword);
      res.status(HttpStatusCode.OK).json({
        success: result,
        message: result ? "Password changed successfully" : "Unable to change password",
      });
    } catch (error: any) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: error.message || "Error changing password" });
    }
  });
}