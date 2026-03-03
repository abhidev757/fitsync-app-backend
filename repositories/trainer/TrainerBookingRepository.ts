import { injectable } from "inversify";
import { Booking, IBooking } from "../../models/bookingModel";
import { BaseRepository } from "../base/BaseRepository";
import { ITrainerBookingRepository } from "../../interfaces/trainer/repositories/ITrainerBookingRepository";

@injectable()
export class TrainerBookingRepository extends BaseRepository<IBooking> implements ITrainerBookingRepository {
    private readonly BookingModel = Booking;

    constructor() { super(Booking); }

    async findByTrainerId(trainerId: string): Promise<IBooking[]> {
        return await this.BookingModel.find({ trainerId }).sort({ createdAt: -1 }).populate("userId").lean().exec();
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
}