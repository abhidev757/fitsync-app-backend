/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import AdminTokenService from '../utils/adminTokenService';
import Admin from '../models/AdminModel';

interface AuthenticatedRequest extends Request {
  admin?: any;
}

const adminProtect = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    
  const adminAccessToken = req.cookies.adminAccessToken;
  const adminRefreshToken = req.cookies.adminRefreshToken;
  console.log('AdminAccessToken:',adminAccessToken);
  console.log('AdminRefreshToken:',adminRefreshToken);
  
  if (adminAccessToken) {
    const decodedAccess = AdminTokenService.verifyAdminAccessToken(adminAccessToken);
    if (decodedAccess) {
      req.admin = await Admin.findById(decodedAccess.adminId).select('-password');
      if (req.admin) req.admin.role = decodedAccess.role;
      return next();
    }
  }
  if (adminRefreshToken) {
    const decodedRefresh = AdminTokenService.verifyAdminRefreshToken(adminRefreshToken);
    if (decodedRefresh) {
      const admin = await Admin.findById(decodedRefresh.adminId);
      
      if (admin) {
        const newAdminAccessToken = AdminTokenService.generateAdminAccessToken(admin._id.toString(),admin.role);
        
        AdminTokenService.setAdminTokenCookies(res, newAdminAccessToken, adminRefreshToken);
        
        req.admin = admin;
        if (req.admin) req.admin.role = decodedRefresh.role;
        return next();
      }
    }
  }

  res.status(401);
  throw new Error('Not authorized, invalid or expired token');
});

export { adminProtect };