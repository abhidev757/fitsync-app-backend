import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';

interface AuthenticatedRequest extends Request {
  user?: { isBlocked?: boolean; [key: string]: any };
  trainer?: { isBlocked?: boolean; [key: string]: any };
}

export const blockCheckMiddleware = asyncHandler(
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const currentUser = req.user || req.trainer;
    if (currentUser && currentUser.isBlocked) {
      // Optionally, you could also check req.admin if you need similar behavior for admins.
      res.status(403).json({ message: 'You have been blocked by the admin.' });
      return;
    }
    next();
  }
);
