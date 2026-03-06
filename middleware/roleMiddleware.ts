/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';

interface AuthenticatedRequest extends Request {
  user?: any;
  trainer?: any;
  admin?: any;
  role?: string;
}

import * as fs from 'fs';

export const checkRole = (roles: string[]) => {
  return asyncHandler((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const currentUser = req.user || req.trainer || req.admin;
    
    // Check either the explicit object property (currentUser.role) OR the request context role (req.role)
    const userRole = (currentUser && currentUser.role) || req.role || req.body?.role;
    
    if (currentUser && roles.includes(userRole)) {
      return next();
    }

    res.status(403);
    throw new Error('Access denied. You do not have the required permissions.');
  });
};
