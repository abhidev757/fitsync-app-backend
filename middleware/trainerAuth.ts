/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import TokenService from '../utils/TrainerTokenService';
import Trainer from '../models/TrainerModel';

interface AuthenticatedRequest extends Request {
  user?: any;
}

const trainerProtect = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    const accessToken = req.cookies.trainerAccessToken;
    const refreshToken = req.cookies.trainerRefreshToken;    

  if (accessToken) {
    const decodedAccess = TokenService.verifyAccessToken(accessToken);
    if (decodedAccess) {
      req.user = await Trainer.findById(decodedAccess.userId).select('-password');
      if (req.user) req.user.role = decodedAccess.role;
      return next();
    }
  }
  if (refreshToken) {
    const decodedRefresh = TokenService.verifyRefreshToken(refreshToken);
    if (decodedRefresh) {
      const user = await Trainer.findById(decodedRefresh.userId);
      
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

export { trainerProtect };