import { IBooking } from "../../../models/bookingModel";

export interface ITrainerBookingService {
    getTrainerBookings(trainerId: string): Promise<IBooking[]>;
    getBookingDetails(bookingId: string): Promise<IBooking | null>;
    cancelBookingByTrainer(bookingId: string): Promise<IBooking>;
    completeSessionByTrainer(bookingId: string): Promise<IBooking>;
}
