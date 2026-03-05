import { IBooking } from "../../../models/bookingModel";
import { TrainerDashboardStats } from "../repositories/ITrainerBookingRepository";

export interface ITrainerBookingService {
    getTrainerBookings(trainerId: string): Promise<IBooking[]>;
    getBookingDetails(bookingId: string): Promise<IBooking | null>;
    cancelBookingByTrainer(bookingId: string): Promise<IBooking>;
    completeSessionByTrainer(bookingId: string): Promise<IBooking>;
    getDashboardStats(trainerId: string): Promise<TrainerDashboardStats>;
}
