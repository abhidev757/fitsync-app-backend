import { IBooking } from "../../../models/bookingModel";

export interface ITrainerBookingRepository {
    findByTrainerId(trainerId: string): Promise<IBooking[]>;
    findByBookingId(bookingId: string): Promise<IBooking | null>;
    updateBookingStatus(bookingId: string, status: string): Promise<IBooking>;
}