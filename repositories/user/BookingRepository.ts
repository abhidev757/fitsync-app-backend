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

    private parse12HourTime(timeStr: string): { hours: number, minutes: number } {
        const [time, modifier] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (hours === 12) {
            hours = 0;
        }
        if (modifier && modifier.toUpperCase() === 'PM') {
            hours += 12;
        }
        return { hours, minutes };
    }

    async findExpiredBookings(currentDate: Date): Promise<IBooking[]> {
        const startOfTomorrow = new Date(currentDate);
        startOfTomorrow.setHours(24, 0, 0, 0);

        const possibleExpired = await this.BookingModel.find({
            status: "confirmed",
            startDate: { $lt: startOfTomorrow }
        }).exec();

        const expiredBookings: IBooking[] = [];

        for (const booking of possibleExpired) {
            try {
                const parts = booking.sessionTime.split("-");
                if (parts.length < 2) {
                    const startOfDay = new Date(currentDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    if (new Date(booking.startDate) < startOfDay) {
                        expiredBookings.push(booking);
                    }
                    continue;
                }

                const endTimeStr = parts[1].trim();
                const { hours, minutes } = this.parse12HourTime(endTimeStr);
                
                const expirationDate = new Date(booking.startDate);
                expirationDate.setHours(hours, minutes, 0, 0);

                if (expirationDate < currentDate) {
                    expiredBookings.push(booking);
                }
            } catch (err) {
                console.error(`Error parsing session time for booking ${booking._id}:`, err);
            }
        }

        return expiredBookings;
    }
}