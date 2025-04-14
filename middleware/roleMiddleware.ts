/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';

interface AuthenticatedRequest extends Request {
  user?: any;
  trainer?: any;
  admin?: any;
}

export const checkRole = (roles: string[]) => {
  return asyncHandler((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const currentUser = req.user || req.trainer || req.admin;

    if (currentUser && roles.includes(currentUser.role)) {
      console.log(`${currentUser.role} role authorized`);
      return next();
    }

    res.status(403);
    throw new Error('Access denied. You do not have the required permissions.');
  });
};
