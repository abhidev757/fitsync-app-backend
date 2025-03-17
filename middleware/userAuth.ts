/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import TokenService from '../utils/UserTokenService';
import User from '../models/UserModel';

interface AuthenticatedRequest extends Request {
  user?: any;
}

const userProtect = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log("Received Cookies:", req.cookies);
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  if (accessToken) {
    const decodedAccess = TokenService.verifyAccessToken(accessToken);
    if (decodedAccess) {
      req.user = await User.findById(decodedAccess.userId).select('-password');
      if (req.user) req.user.role = decodedAccess.role;
      return next();
    }
  }
  if (refreshToken) {
    const decodedRefresh = TokenService.verifyRefreshToken(refreshToken);
    if (decodedRefresh) {
      const user = await User.findById(decodedRefresh.userId);
      
      if (user) {
        const newAccessToken = TokenService.generateAccessToken(user._id.toString(),user.role);
        
        TokenService.setTokenCookies(res, newAccessToken, refreshToken);
        
        req.user = user;
        if (req.user) req.user.role = decodedRefresh.role;
        return next();
      }
    }
  }

  res.status(401);
  throw new Error('Not authorized, invalid or expired token');
});

export { userProtect };