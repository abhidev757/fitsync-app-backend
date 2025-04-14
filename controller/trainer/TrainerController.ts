import { Request, Response } from "express";
import asyncHandler from 'express-async-handler'
import { ITrainerService } from "../../interfaces/trainer/ITrainerService";
import { HttpStatusCode } from "../../enums/HttpStatusCode";
import { StatusMessage } from "../../enums/StatusMessage";
import { inject, injectable } from "inversify";
import { GoogleAuthService } from "../../services/user/GoogleAuthService";
import { TrainerGoogleAuthService } from "../../services/trainer/TrainerGoogleAuthService";
import TrainerTokenService from "../../utils/TrainerTokenService";
import { ITimeSlotInput, ITimeSlots } from "../../types/timeSlots.types";



@injectable()
export class TrainerController {
    constructor(@inject('ITrainerService') private readonly trainerService: ITrainerService) {}

    authTrainer = asyncHandler(async (req: Request, res: Response)=>{
        try {
            const {email, password} = req.body;

            const trainer = await this.trainerService.authenticateTrainer(email,password);
            if(!trainer) {
                res.status(HttpStatusCode.NOT_FOUND).json({message: StatusMessage.NOT_FOUND})
                return
            }
            if(trainer.status === false) {
                res.status(HttpStatusCode.FORBIDDEN).json({message:StatusMessage.ACCOUNT_BLOCKED});
                return
            }
            const accessToken = TrainerTokenService.generateAccessToken(trainer._id.toString(),trainer.role);
            const refreshToken = TrainerTokenService.generateRefreshToken(trainer._id.toString(),trainer.role);
            TrainerTokenService.setTokenCookies(res, accessToken,refreshToken);
            
            
            res.status(HttpStatusCode.OK).json({
                _id: trainer._id,
                name: trainer.name,
                email: trainer.email,
                role: trainer.role,
                isGoogleLogin: trainer.isGoogleLogin
            });

        } catch(err) {
            console.log(err);
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message:StatusMessage.INTERNAL_SERVER_ERROR})
            
        }
    })

    logoutTrainer = asyncHandler(async (req: Request,res: Response)=>{
        try {
            res.cookie('trainerAccessToken','',{
                httpOnly: true,
                expires: new Date(0)
            });
            res.cookie('trainerRefreshToken','',{
                httpOnly: true,
                expires: new Date(0)
            })
            res.status(HttpStatusCode.OK).json({message: StatusMessage.SUCCESS});
        } catch(err) {
            console.log(err);
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message:StatusMessage.INTERNAL_SERVER_ERROR})
        }
    })

    refreshToken = asyncHandler(async (req: Request, res: Response)=> {
        const refreshToken = req.cookies.trainerRefreshToken;
        console.log("Trainer Refresh token:",refreshToken)
        if(!refreshToken) {
            res.status(401).json({message:'No refresh token'})
            return
        }
        const decoded = TrainerTokenService.verifyRefreshToken(refreshToken);
        if(!decoded) {
            res.status(401).json({message: 'Invalid refresh token'})
            return 
        } 
        const trainer = await this.trainerService.getTrainerById(decoded.userId);
        if(!trainer) {
            res.status(401).json({message:'Trainer is not found'})
            return;
        }
        const newAccessToken = TrainerTokenService.generateAccessToken(trainer._id.toString(),trainer.role);
        TrainerTokenService.setTokenCookies(res, newAccessToken, refreshToken)
        res.status(200).json({message:'Token refreshed successfully'})
    })

    registerTrainer = asyncHandler(async(req: Request, res: Response)=>{
        try {
            const{name, email, password, specializations,certificateUrl,profileImageUrl} = req.body;
        const trainerExist = await this.trainerService.authenticateTrainer(email,password);
        if(trainerExist) {
            res.status(HttpStatusCode.BAD_REQUEST).json({message: StatusMessage.BAD_REQUEST});
            return
        }
        const trainer = await this.trainerService.registerTrainer({name,email,password,specializations,certificateUrl,profileImageUrl});
        res.status(HttpStatusCode.CREATED).json(trainer)
        } catch(err) {
            console.log(err);
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message: StatusMessage.INTERNAL_SERVER_ERROR})
        }
    })

    verifyOTP = asyncHandler(async (req: Request, res: Response) => {
        const { emailId, otp } = req.body;
        if (!emailId || !otp) {
            res.status(HttpStatusCode.BAD_REQUEST).json({ message: StatusMessage.BAD_REQUEST });
            return;
        }
    
        try {
            const isVerified = await this.trainerService.verifyOTP(emailId, otp);
            res.status(HttpStatusCode.OK).json({ success: isVerified });
        } catch (error) {
            console.log(error);
            res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: StatusMessage.BAD_REQUEST })
        }
    })

    resendOTP = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { emailId } = req.body;
            if (!emailId) {
                res.status(HttpStatusCode.BAD_REQUEST).json({ message: StatusMessage.BAD_REQUEST });
                return;
            }
            const result = await this.trainerService.resendOTP(emailId);
            res.status(result.success ? HttpStatusCode.OK : HttpStatusCode.BAD_REQUEST).json(result);
        } catch (error) {
            console.log(error);
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
        }
    });

    requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;
        if (!email) {
            res.status(HttpStatusCode.BAD_REQUEST).json({ message: StatusMessage.BAD_REQUEST }); 
            return;
        }
    
        try {
            await this.trainerService.requestPasswordReset(email);
            res.status(HttpStatusCode.OK).json({ message: StatusMessage.SUCCESS }); 
        } catch (error) {
            console.log(error);
            res.status(HttpStatusCode.BAD_REQUEST).json({ message: StatusMessage.BAD_REQUEST }); 
        }
    });

    resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const { token } = req.params;
        const { password } = req.body;
        try {
            await this.trainerService.resetPassword(token, password);
            res.status(HttpStatusCode.OK).json({ message: StatusMessage.SUCCESS }); 
        } catch (error) {
            console.log(error);
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR }); 
        }
    });

    googleAuth = asyncHandler(async (req: Request, res: Response) => {
        try {
          const { credential } = req.body;
          const trainerGoogleAuthService = new TrainerGoogleAuthService();
          const payload = await trainerGoogleAuthService.verifyGoogleToken(credential);
          if (!payload) {
            res.status(HttpStatusCode.UNAUTHORIZED).json({ 
              message: 'Invalid Google token' 
            });
            return;
          }
      
          const trainer = await trainerGoogleAuthService.findOrCreateUser(payload);
          
          if (!trainer.status) {
            res.status(HttpStatusCode.FORBIDDEN).json({ 
              message: StatusMessage.ACCOUNT_BLOCKED 
            });
            return;
          }
            const accessToken = TrainerTokenService.generateAccessToken(trainer._id.toString(),trainer.role);
            const refreshToken = TrainerTokenService.generateRefreshToken(trainer._id.toString(),trainer.role)

            TrainerTokenService.setTokenCookies(res, accessToken, refreshToken);
          
          res.status(HttpStatusCode.OK).json({
            _id: trainer._id,
            name: trainer.name,
            email: trainer.email,
            role : trainer.role,
            isGoogleLogin:trainer.isGoogleLogin,
          });
        } catch (error) {
          console.error('Google Auth Error:', error);
          res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
            message: StatusMessage.INTERNAL_SERVER_ERROR 
          });
        }
      });

      getTrainerDetails = asyncHandler(async (req: Request, res: Response) => {
          try {
            const userId = req.params.id;
            console.log("Trainer ID: ",userId);
            const trainerProfile = await this.trainerService.getTrainerProfile(userId);
            console.log("TrainerProfile", trainerProfile);
      
            if (!trainerProfile) {
              res.status(404).json({ message: "Trainer not found" });
              return;
            }
      
            res.status(200).json(trainerProfile);
          } catch (error) {
            console.error("Error fetching trainer profile:", error);
            res.status(500).json({ message: "Failed to fetch trainer profile" });
          }
        });
      
        trainerEditProfile = asyncHandler(async (req: Request, res: Response) => {
          try {
            const userId = req.params.id; 
            const { userData } = req.body;
            console.log('trainer Data in controller', userData);
            console.log('Request Body', req.body);
            

            if (!userId) {
              res.status(400).json({ message: "Trainer ID is required" });
              return;
            }
      
            
            const updatedProfile = await this.trainerService.updateTrainerProfile(userId,userData);
      
            
            res.status(200).json({
              message: "Profile updated successfully",
              user: updatedProfile
            });
          } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ message: "Failed to update profile" });
          }
        });

        uploadCertificate = asyncHandler(async (req: Request, res: Response) => {
          if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return
          }
      
          try {
            const uploadedFile = await this.trainerService.uploadCertificate(req.file);
            res.status(200).json({ fileUrl: uploadedFile.fileUrl });
          } catch (error) {
            res.status(500).json({ message: "File upload failed" });
          }
        });
        uploadProfile = asyncHandler(async (req: Request, res: Response) => {
          if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return
          }
      
          try {
            const uploadedFile = await this.trainerService.uploadProfile(req.file);
            res.status(200).json({ fileUrl: uploadedFile.fileUrl });
          } catch (error) {
            res.status(500).json({ message: "File upload failed" });
          }
        });

        addTimeSlot = asyncHandler(async (req: Request, res: Response) => {
            try {
              const { sessionType, startDate, endDate, time, price, numberOfSessions,userId } =
                req.body;
        
              const data: ITimeSlotInput = {
                trainerId:userId,
                sessionType,
                startDate,
                endDate,
                time,
                price,
                numberOfSessions,
              };
              await this.trainerService.addTimeSlot(data);
        
              res.status(200).json({ message: "Time Slot data saved successfully" });
            } catch (error) {
              console.error("Error saving time slot data:", error);
              res.status(500).json({ message: "Internal Server Error" });
            }
          });
          getTimeSlots = asyncHandler(async (req: Request, res: Response) => {
            try {
              let timeSlot = await this.trainerService.getTimeSlots();
        
              res.status(200).json(timeSlot);
            } catch (error) {
              console.error("Error fetching data:", error);
              res.status(500).json({ message: "Internal Server Error" });
            }
          });

          getTrainerBookings = asyncHandler(async (req: Request, res: Response) => {
            try {
              const trainerId = req.params.id;
              console.log("trainer ID: ", trainerId);
              const Bookings = await this.trainerService.getTrainerBookings(trainerId);
              console.log("Bookings:", Bookings);
          
              if (!Bookings) {
                res.status(404).json({ message: "Bookings not found" });
                return;
              }
          
              res.status(200).json(Bookings);
            } catch (error) {
              res.status(500).json({ message: "Failed to fetch Bookings " });
            }
          });

          getBookingDetails = asyncHandler(async (req: Request, res: Response) => {
            try {
              const bookingId = req.params.id;
              console.log("Booking ID: ", bookingId);
              const Bookings = await this.trainerService.getBookingDetails(bookingId);
              console.log("Booking:", Bookings);
          
              if (!Bookings) {
                res.status(404).json({ message: "Bookings not found" });
                return;
              }
          
              res.status(200).json(Bookings);
            } catch (error) {
              res.status(500).json({ message: "Failed to fetch Bookings " });
            }
          });

          cancelBookingByTrainer = asyncHandler(async (req: Request, res: Response) => {
            const { bookingId } = req.params;
          
            try {
              const cancelledBooking = await this.trainerService.cancelBookingByTrainer(bookingId);
              res.status(200).json({
                message: "Booking cancelled successfully",
                booking: cancelledBooking,
              });
            } catch (error) {
              console.error("Error cancelling booking:", error);
              res.status(500).json({ message: "Failed to cancel booking" });
            }
          });

          getWalletDetails = asyncHandler(async (req: Request, res: Response) => {
            const trainerId = req.params.id;
            if (!trainerId) {
              res.status(401);
              throw new Error('Unauthorized');
            }
          
            const walletData = await this.trainerService.getWalletDetails(trainerId);
            res.json(walletData);
          });
}
