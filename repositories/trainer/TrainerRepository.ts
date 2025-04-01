import { injectable } from "inversify";
import mongoose, { Error } from "mongoose";
import Trainer from "../../models/TrainerModel";
import TimeSlots from "../../models/timeSlotsModel";
import { ITrainer, IBlockedTrainerResponse, IUnblockedTrainerResponse } from "../../types/trainer.types";
import { BaseRepository } from "../base/BaseRepository";
import { ITrainerRepository } from "../../interfaces/trainer/ITrainerRepository";
import { UploadedFile } from "../../types/UploadedFile.types";
import { ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DaySchedule, ITimeSlotInput, ITimeSlots } from "../../types/timeSlots.types";
import { Booking, IBooking } from "../../models/bookingModel";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });


@injectable()
export class TrainerRepository extends BaseRepository<ITrainer> implements ITrainerRepository {
    private readonly TrainerModel = Trainer;
    private readonly TimeSlotModel = TimeSlots
    private readonly BookingModel = Booking

    constructor() {
        super(Trainer)
    }

    async findByEmail(email: string): Promise<ITrainer | null> {
        try{
            return await this.TrainerModel.findOne({email})
        } catch(err) {
            console.error('Error finding trainer by email:', err);
            throw new Error('Failer to find trainer by email')
        }
    }

    async register(trainerData: ITrainer): Promise<ITrainer | null> {
        try {
            const trainer = new this.TrainerModel(trainerData)
            return await trainer.save();
        } catch(err) {
            console.error('Error finding trainer by ID:', err);
            throw new Error('Failed to find trainer')
        }
    }

    async findById(trainerId: string): Promise<ITrainer | null> {
        try {
            return await this.TrainerModel.findById(trainerId);
        } catch (error) {
            console.error('Error finding trainer by ID:', error);
            throw new Error('Failed to find trainer');
        }
    }

    async update(userId: string, data: Partial<ITrainer>): Promise<ITrainer | null> {
            try {
                return await this.TrainerModel.findByIdAndUpdate(userId, { $set: data }, { new: true });
            } catch (error) {
                console.error('Error updating user:', error);
                throw new Error('Failed to update user');
            }
        }

        async uploadCertificate(file: Express.Multer.File): Promise<UploadedFile> {
            const params = {
              Bucket: process.env.AWS_S3_BUCKET_NAME || "your-default-bucket-name",
              Key: `certificates/${Date.now().toString()}-${file.originalname}`,
              Body: file.buffer,
              ContentType: file.mimetype,
            };
        
            try {
              const command = new PutObjectCommand(params);
              await s3.send(command);
        
              const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
              return { fileUrl }; 
            } catch (error) {
              throw new Error("Failed to upload file to S3");
            }
          }
        async uploadProfile(file: Express.Multer.File): Promise<UploadedFile> {
            const params = {
              Bucket: process.env.AWS_S3_BUCKET_NAME || "your-default-bucket-name",
              Key: `profile-images/${Date.now().toString()}-${file.originalname}`,
              Body: file.buffer,
              ContentType: file.mimetype,
            };
        
            try {
              const command = new PutObjectCommand(params);
              await s3.send(command);
        
              const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
              return { fileUrl }; 
            } catch (error) {
              throw new Error("Failed to upload file to S3");
            }
          }

          async addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null> {
            try {
                // Convert DD/MM/YYYY to Date object
                const parseDate = (dateString: string): Date => {
                    const [day, month, year] = dateString.split('/');
                    return new Date(`${year}-${month}-${day}`);
                };
        
                const timeSlot = new this.TimeSlotModel({
                    ...data,
                    startDate: parseDate(data.startDate as unknown as string),
                    endDate: parseDate(data.endDate as unknown as string)
                });
        
                return await timeSlot.save();
            } catch(err) {
                console.error('Error saving time slot:', err);
                throw new Error('Failed to save time slot');
            }
        }
        async getTimeSlots(): Promise<DaySchedule[]> {
          try {
              const results = await this.TimeSlotModel.aggregate([
                  {
                      $project: {
                          date: {
                              $dateToString: {
                                  format: "%d %B %Y",
                                  date: "$startDate"
                              }
                          },
                          time: 1,
                          sessionType: 1
                      }
                  },
                  {
                      $group: {
                          _id: "$date",
                          slots: {
                              $push: {
                                  time: "$time",
                                  type: "$sessionType"
                              }
                          }
                      }
                  },
                  {
                      $project: {
                          _id: 0,
                          date: "$_id",
                          slots: 1
                      }
                  },
                  { $sort: { date: 1 } }
              ]);
      
              return results;
          } catch (err) {
              console.error('Error fetching time slots:', err);
              throw new Error('Failed to fetch time slots');
          }
      }


      async findByTrainerId(trainerId: string): Promise<IBooking[]> {
                  return await this.BookingModel.find({ trainerId })
                    .populate('userId')
                    .lean()
                    .exec();
                }
      async findByBookingId(bookingId: string): Promise<IBooking | null> {
          const result = await this.BookingModel.findById(bookingId)
            .populate('userId', 'name email phone') 
            .populate('trainerId', 'name email phone profileImageUrl yearsOfExperience') 
            .exec();
          return result;
        }
                  
}