import { IBooking } from "../../models/bookingModel";
import { DaySchedule, ITimeSlotInput, ITimeSlots } from "../../types/timeSlots.types";
import { ITrainer, IBlockedTrainerResponse,IUnblockedTrainerResponse } from "../../types/trainer.types";
import { UploadedFile } from "../../types/UploadedFile.types";

export interface ITrainerRepository {
createNewData(trainerData: Partial<ITrainer>): Promise<ITrainer | null>
updateOneById(id: string, data: Partial<ITrainer>): Promise<ITrainer | null>;
findByEmail(email: string): Promise<ITrainer | null>;
register(userData: Partial<ITrainer>): Promise<ITrainer | null>;
findById(id: string): Promise<ITrainer | null>;
update(id: string, data: Partial<ITrainer>): Promise<ITrainer | null>;
uploadCertificate(file: Express.Multer.File): Promise<UploadedFile>;
uploadProfile(file: Express.Multer.File): Promise<UploadedFile>;
addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null>
getTimeSlots(): Promise<DaySchedule[]>
findByTrainerId(trainerId: string): Promise<IBooking[]>
findByBookingId(bookingId: string): Promise<IBooking | null> 
}