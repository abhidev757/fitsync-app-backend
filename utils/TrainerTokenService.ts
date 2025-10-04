import jwt from 'jsonwebtoken';
import { Response } from 'express';

interface TokenPayload {
  trainerId: string;
  role: string
  tokenType: 'access' | 'refresh';
}

class TrainerTokenService {
  static generateAccessToken(trainerId: string,role:string): string {
    return jwt.sign(
      { trainerId,role, tokenType: 'access' }, 
      process.env.TRAINER_ACCESS_TOKEN_SECRET as string, 
      { expiresIn: '15m' }
    );
  }

  static generateRefreshToken(trainerId: string,role:string): string {
    return jwt.sign(
      { trainerId,role, tokenType: 'refresh' },
      process.env.TRAINER_REFRESH_TOKEN_SECRET as string, 
      { expiresIn: '7d' }
    );
  }

  static setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie('trainerAccessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('trainerRefreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, process.env.TRAINER_ACCESS_TOKEN_SECRET as string) as TokenPayload;
      return decoded.tokenType === 'access' ? decoded : null;
    } catch (error) {
        console.log(error);
      return null;
    }
  }

  static verifyRefreshToken(token: string): TokenPayload | null {
    try {
      console.log('Verifying refresh token with secret:', process.env.TRAINER_REFRESH_TOKEN_SECRET);
      const decoded = jwt.verify(token, process.env.TRAINER_REFRESH_TOKEN_SECRET as string) as TokenPayload;
      return decoded.tokenType === 'refresh' ? decoded : null;
    } catch (error) {
        console.log(error);
      return null;
    }
  }
}

export default TrainerTokenService;