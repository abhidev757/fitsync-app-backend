/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import TokenService from '../utils/TrainerTokenService';
import Trainer from '../models/TrainerModel';

interface AuthenticatedRequest extends Request {
  trainer?: any;
}

const trainerProtect = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    const accessToken = req.cookies.trainerAccessToken;
    const refreshToken = req.cookies.trainerRefreshToken;    

  if (accessToken) {
    const decodedAccess = TokenService.verifyAccessToken(accessToken);
    if (decodedAccess) {
      req.trainer = await Trainer.findById(decodedAccess.trainerId).select('-password');
      if (req.trainer) req.trainer.role = decodedAccess.role;
      return next();
    }
  }
  if (refreshToken) {
    const decodedRefresh = TokenService.verifyRefreshToken(refreshToken);
    if (decodedRefresh) {
      const trainer = await Trainer.findById(decodedRefresh.trainerId);
      
      if (trainer) {
        const newAccessToken = TokenService.generateAccessToken(trainer._id.toString(),trainer.role);
        TokenService.setTokenCookies(res, newAccessToken, refreshToken);
        
        req.trainer = trainer;
        if (req.trainer) req.trainer.role = decodedRefresh.role;
        return next();
      }
    }
  }

  res.status(401);
  throw new Error('Not authorized, invalid or expired token');
});

export { trainerProtect };