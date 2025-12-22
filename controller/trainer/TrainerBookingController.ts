import { Request, Response } from "express";
import asyncHandler from 'express-async-handler';
import { inject, injectable } from "inversify";
import { ITrainerBookingService } from "../../interfaces/trainer/services/ITrainerBookingService";

@injectable()
export class TrainerBookingController {
    constructor(@inject('ITrainerBookingService') private readonly trainerBookingService: ITrainerBookingService) {}

    getTrainerBookings = asyncHandler(async (req: Request, res: Response) => {
        try {
            const trainerId = req.params.id;
            const Bookings = await this.trainerBookingService.getTrainerBookings(trainerId);

            if (!Bookings) {
                res.status(404).json({ message: "Bookings not found" });
                return;
            }
            res.status(200).json(Bookings);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch Bookings" });
        }
    });

    getBookingDetails = asyncHandler(async (req: Request, res: Response) => {
        try {
            const bookingId = req.params.id;
            const Bookings = await this.trainerBookingService.getBookingDetails(bookingId);

            if (!Bookings) {
                res.status(404).json({ message: "Bookings not found" });
                return;
            }
            res.status(200).json(Bookings);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch Bookings" });
        }
    });

    cancelBookingByTrainer = asyncHandler(async (req: Request, res: Response) => {
        const { bookingId } = req.params;
        try {
            const cancelledBooking = await this.trainerBookingService.cancelBookingByTrainer(bookingId);
            res.status(200).json({
                message: "Booking cancelled successfully",
                booking: cancelledBooking,
            });
        } catch (error) {
            console.error("Error cancelling booking:", error);
            res.status(500).json({ message: "Failed to cancel booking" });
        }
    });
}