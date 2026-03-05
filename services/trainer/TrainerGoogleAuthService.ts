import { OAuth2Client } from 'google-auth-library';
import { ITrainer } from '../../types/trainer.types';
import Trainer from '../../models/TrainerModel';
import crypto from 'crypto';
export class TrainerGoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verifyGoogleToken(token: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      return payload;
    } catch (error) {
        console.log(error);
        
      throw new Error('Invalid Google token');
    }
  }

  async findOrCreateUser(payload: any, certificateUrl?: string): Promise<ITrainer> {
    try {
      if (!payload?.email) {
        throw new Error('No email found in Google payload');
      }

      let user = await Trainer.findOne({ email: payload.email });
      if (!user) {
        // New trainer — certificate is required
        if (!certificateUrl) {
          throw new Error('CERTIFICATE_REQUIRED');
        }
        user = await Trainer.create({
          name: payload.name,
          email: payload.email,
          password: crypto.randomBytes(16).toString('hex'),
          profileImageUrl: payload.picture || '',
          certificateUrl,
          status: true,
          isGoogleLogin: true,
          googleId: payload.sub,
        });
        return user;
      }

      // Existing trainer signing in — just refresh the isGoogleLogin flag
      user = await Trainer.findOneAndUpdate(
        { email: payload.email },
        { isGoogleLogin: true },
        { new: true }
      );

      if (!user) {
        throw new Error('Failed to update existing user');
      }
      return user;

    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      // Re-throw known errors so the controller can handle them
      if ((error as Error).message === 'CERTIFICATE_REQUIRED') throw error;
      throw new Error('Error creating user from Google data');
    }
  }
}

