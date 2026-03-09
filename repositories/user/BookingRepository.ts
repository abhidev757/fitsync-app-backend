import { injectable } from "inversify";
import { Booking, IBooking } from "../../models/bookingModel";
import { CreateBookingDto } from "../../types/user.types";
import { BaseRepository } from "../base/BaseRepository";
import { IBookingRepository } from "../../interfaces/user/repositories/IBookingRepository";

@injectable()
export class BookingRepository extends BaseRepository<IBooking> implements IBookingRepository {
    private readonly BookingModel = Booking;

    constructor() { super(Booking); }

    async createBooking(bookingData: CreateBookingDto): Promise<IBooking> {
        return await this.BookingModel.create(bookingData);
    }

    async findByUserId(userId: string): Promise<IBooking[]> {
        return await this.BookingModel.find({ userId }).sort({ createdAt: -1 }).populate("trainerId").lean().exec();
    }

    async findByBookingId(bookingId: string): Promise<IBooking | null> {
        return await this.BookingModel.findById(bookingId)
            .populate("userId", "name email phone")
            .populate("trainerId", "name email phone profileImageUrl yearsOfExperience")
            .exec();
    }

    async updateBookingStatus(bookingId: string, status: string): Promise<IBooking> {
        const updatedBooking = await this.BookingModel.findByIdAndUpdate(bookingId, { status }, { new: true });
        if (!updatedBooking) throw new Error("Booking not found");
        return updatedBooking;
    }

    async findExpiredBookings(currentDate: Date): Promise<IBooking[]> {
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);

        return await this.BookingModel.find({
            status: "confirmed",
            startDate: { $lt: startOfDay }
        }).exec();
    }
}