import { injectable } from "inversify";
import { IVideoRepository } from "../../interfaces/video/IVideoRepository";
import {Booking} from "../../models/bookingModel"; 

@injectable()
export class VideoRepository implements IVideoRepository {
    private readonly BookingModel = Booking;

    async findBookingById(sessionId: string) {
        return await this.BookingModel.findById(sessionId);
    }

   async updateStatus(sessionId: string, status: 'waiting' | 'live' | 'ended'): Promise<boolean> {
        const result = await Booking.findOneAndUpdate(
            { meetingId: sessionId }, 
            { meetingStatus: status }, 
            { new: true }
        );
        // Fix: Convert the document/null into a boolean
        // If result is a document, !!result is true. If result is null, !!result is false.
        return !!result; 
    }
}