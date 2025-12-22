import { IBooking } from "../../../models/bookingModel";

export interface IBookingService {
    createBooking(bookingData: Partial<IBooking>): Promise<IBooking>;
    getUserBookings(userId: string): Promise<IBooking[]>;
    getBookingDetails(bookingId: string): Promise<IBooking | null>;
    cancelBookingByUser(bookingId: string): Promise<IBooking>;
}