import { IBooking } from "../../../models/bookingModel";
import { CreateBookingDto } from "../../../types/user.types";

export interface IBookingRepository {
    createBooking(bookingData: CreateBookingDto): Promise<IBooking>;
    findByUserId(userId: string): Promise<IBooking[]>;
    findByBookingId(bookingId: string): Promise<IBooking | null>;
    updateBookingStatus(bookingId: string, status: string): Promise<IBooking>;
    findExpiredBookings(currentDate: Date): Promise<IBooking[]>;
}