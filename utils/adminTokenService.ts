import jwt from 'jsonwebtoken'
import { Response } from 'express';

interface TokenPayload {
    adminId: string;
    role: string;
    tokenType: 'access' | 'refresh';
}

class AdminTokenService {
    static generateAdminAccessToken(adminId: string, role:string): string {
        return jwt.sign(
            {adminId, role, adminTokenType: 'access'},
            process.env.ACCESS_TOKEN_SECRET_ADMIN as string,
            {expiresIn: '15m'}
        );
    };
    static generateAdminRefreshToken(adminId: string, role: string): string {
        return jwt.sign(
            {adminId, role, adminTokenType: 'refresh'},
            process.env.REFRESH_TOKEN_SECRET_ADMIN as string,
            {expiresIn: '7d'}
        )
    }
    static setAdminTokenCookies(res: Response, adminAccessToken: string, adminRefreshToken: string): void {
        res.cookie('adminAccessToken', adminAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 //15 mins
        })

        res.cookie('adminRefreshToken', adminRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 //7 days
        })
    }

    static verifyAccessToken(token: string): TokenPayload | null {
        try {
          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as TokenPayload;
          return decoded.tokenType === 'access' ? decoded : null;
        } catch (error) {
            console.log(error);
          return null;
        }
      }
    
      static verifyRefreshToken(token: string): TokenPayload | null {
        try {
          const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as TokenPayload;
          return decoded.tokenType === 'refresh' ? decoded : null;
        } catch (error) {
            console.log(error);
          return null;
        }
      }

 }
 export default AdminTokenService