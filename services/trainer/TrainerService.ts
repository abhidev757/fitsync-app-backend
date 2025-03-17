import { inject,injectable } from "inversify";
import { ITrainerService } from "../../interfaces/trainer/ITrainerService";
import { ITrainerRepository } from "../../interfaces/trainer/ITrainerRepository";
import { ITrainer, IBlockedTrainerResponse, IUnblockedTrainerResponse, ITrainerProfile } from "../../types/trainer.types";
import {generateOTP, sendOTP} from '../../utils/otpConfig'
import { sendResetEmail } from "../../utils/resetGmail";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';






@injectable()
export class TrainerService implements ITrainerService {
    constructor(@inject('ITrainerRepository') private trainerRepository: ITrainerRepository) {}
    async authenticateTrainer(email: string, password: string): Promise<ITrainer | null> {
        try {
            const trainer = await this.trainerRepository.findByEmail(email);
            if(trainer && (await trainer.matchPassword(password))) {
                return trainer
            }
            return null
        } catch(err) {
            console.log(err);
            throw new Error('Failed to authenticate Trainer')
        }
    }

    async registerTrainer(trainerData: ITrainer): Promise<ITrainer | null> {
        let dataToUpdate: Partial<ITrainer> | null = null
        try {
            const otp = generateOTP()
            const otpExpiresAt = new Date(Date.now()+1*60*1000);
            const trainer = await this.trainerRepository.createNewData({
                ...trainerData,
                otp,
                otpExpiresAt
            });
            if(!trainer) {
                throw new Error('Trainer registeration failed');
            }
            await sendOTP(trainerData.email,otp);
            if(dataToUpdate) {
                await this.trainerRepository.updateOneById(trainer._id.toString(), dataToUpdate)
            }
            return trainer
        } catch(err) {
            console.log(err);
            throw new Error('Failed to register Trainer');
        }
    }

    async getTrainerById(trainerId: string): Promise<ITrainer> {
        try {
            const trainer = await this.trainerRepository.findById(trainerId);
            if (!trainer) {
                throw new Error('trainer not found');
            }
            return trainer;
        } catch (error) {
            console.log(error);
            throw new Error('Failed to Fetch trainer');
        }
    }

    async resendOTP(email: string): Promise<{ success: boolean; message: string }> {
            try {
                const user = await this.trainerRepository.findByEmail(email);
                if (!user) {
                    return { success: false, message: 'User not found' };
                }
        
                const otp = generateOTP();
                const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000);
        
                await this.trainerRepository.update(user._id.toString(), { otp, otpExpiresAt });
                await sendOTP(email, otp);
        
                return { success: true, message: 'OTP sent successfully' };
            } catch (error) {
                console.log(error);
                return { success: false, message: 'Failed to resend OTP' };
            }
        }
    
        async verifyOTP(email: string, otp: string): Promise<boolean> {
            try {
                const user = await this.trainerRepository.findByEmail(email);
                if (!user) {
                    throw new Error('User not found');
                }
            
                if (user.otp !== otp) {
                    throw new Error('Invalid OTP');
                }
            
                if (new Date() > user.otpExpiresAt) {
                    throw new Error('OTP has expired');
                }
            
                return true;
            } catch (error) {
                console.log(error);
                throw new Error('Failed to verify OTP');
            }
        }
    
        async requestPasswordReset(email: string): Promise<void> {
            try {
                const user = await this.trainerRepository.findByEmail(email);
                if (!user) throw new Error('User Not Found');
            
                const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
                const expDate = new Date(Date.now() + 3600000); 
                await this.trainerRepository.update(user._id.toString(), { resetPassword: { token: resetToken, expDate, lastResetDate: new Date() } });
            
                const resetLink = `${process.env.CLIENT_URL}/trainerReset-password/${resetToken}`;
                await sendResetEmail(user.email, resetLink);
            } catch (error) {
                console.log(error);
                throw new Error('Failed to request password reset');
            }
        }
        
        
        async resetPassword(token: string, newPassword: string): Promise<void> {
            try {
                
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
                const user = await this.trainerRepository.findById(decoded.userId);
                if (!user || user.resetPassword.token !== token) throw new Error('Invalid or expired token');
                if (user.resetPassword.expDate && user.resetPassword.expDate < new Date()) {
                    throw new Error('Reset token expired');
                }
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                await this.trainerRepository.update(user._id.toString(), {
                    password: hashedPassword,
                    resetPassword: { ...user.resetPassword, lastResetDate: new Date(), token: null, expDate: null },
                });
            } catch (error) {
                console.log(error);
                throw new Error('Failed to reset password');
            }
        }

        async getTrainerProfile(userId: string):Promise<ITrainerProfile | null> {
              console.log('serviceeee')
              try {
                const trainerProfile = await this.trainerRepository.findById(userId);
                return trainerProfile;
              } catch (error) {
                throw new Error("Failed to fetch trainer profile");
              }
            }
        
            
            async updateTrainerProfile(userId: string, userData: Partial<ITrainer>): Promise<{ user: ITrainer | null }> {
                try {
                    console.log("Updating trainer profile with userId:", userId);
                    console.log("User data to update:", userData);
                    
                    const updatedTrainer = await this.trainerRepository.update(userId, userData);
                    console.log("Updated trainer profile:", updatedTrainer);
                    
                    return { user: updatedTrainer };
                } catch (error) {
                    console.error("Error updating trainer data:", error);
                    throw new Error("Failed to update profile");
                }
            }

}