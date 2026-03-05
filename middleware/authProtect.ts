/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import TokenService from '../utils/UserTokenService';
import TrainerTokenService from '../utils/TrainerTokenService';
import User from '../models/UserModel';
import Trainer from '../models/TrainerModel';

import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: any;
  trainer?: any;
  role?: 'user' | 'trainer';
}

const combinedProtect = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  let userAccessToken = req.cookies.accessToken;
  let userRefreshToken = req.cookies.refreshToken;
  let trainerAccessToken = req.cookies.trainerAccessToken;
  let trainerRefreshToken = req.cookies.trainerRefreshToken;

  // If we have a bearer token but no cookies, figure out who it belongs to
  if (bearerToken) {
    const decoded = jwt.decode(bearerToken) as { role?: string, userId?: string, trainerId?: string } | null;
    if (decoded?.role === 'trainer' || decoded?.trainerId) {
      trainerAccessToken = trainerAccessToken || bearerToken;
    } else {
      userAccessToken = userAccessToken || bearerToken;
    }
  }

  // 1. USER auth
  if (userAccessToken) {
    const decodedUser = TokenService.verifyAccessToken(userAccessToken);
    if (decodedUser) {
      const user = await User.findById(decodedUser.userId).select('-password');
      if (user) {
        req.user = user;
        req.role = 'user';
        return next();
      }
    }
  }

  // 2. TRAINER auth
  if (trainerAccessToken) {
    const decodedTrainer = TrainerTokenService.verifyAccessToken(trainerAccessToken);
    if (decodedTrainer) {
      const trainer = await Trainer.findById(decodedTrainer.trainerId).select('-password');
      if (trainer) {
        req.trainer = trainer;
        req.role = 'trainer';
        return next();
      }
    }
  }

  // Try refresh flows
  // 3. USER refresh
  if (userRefreshToken) {
    const decodedUserRef = TokenService.verifyRefreshToken(userRefreshToken);
    if (decodedUserRef) {
      const user = await User.findById(decodedUserRef.userId).select('-password');
      if (user) {
        const newAccess = TokenService.generateAccessToken(user._id.toString(), user.role);
        TokenService.setTokenCookies(res, newAccess, userRefreshToken);
        req.user = user;
        req.role = 'user';
        return next();
      }
    }
  }

  // 4. TRAINER refresh
  if (trainerRefreshToken) {
    const decodedTrainerRef = TrainerTokenService.verifyRefreshToken(trainerRefreshToken);
    if (decodedTrainerRef) {
      const trainer = await Trainer.findById(decodedTrainerRef.trainerId).select('-password');
      if (trainer) {
        const newAccess = TrainerTokenService.generateAccessToken(trainer._id.toString(), trainer.role);
        TrainerTokenService.setTokenCookies(res, newAccess, trainerRefreshToken);
        req.trainer = trainer;
        req.role = 'trainer';
        return next();
      }
    }
  }

  res.status(401);
  throw new Error('Not authorized, invalid or expired token');
});

export { combinedProtect };
