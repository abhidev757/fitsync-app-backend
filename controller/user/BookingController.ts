import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { inject, injectable } from "inversify";
import { IBookingService } from "../../interfaces/user/services/IBookingService";
import { HttpStatusCode } from "../../enums/HttpStatusCode";
import { StatusMessage } from "../../enums/StatusMessage";

@injectable()
export class BookingController {
  constructor(@inject("IBookingService") private readonly bookingService: IBookingService) {}

  createBooking = asyncHandler(async (req: Request, res: Response) => {
    try {
      const bookingData = req.body;
      const booking = await this.bookingService.createBooking(bookingData);
      res.status(HttpStatusCode.CREATED).json(booking);
    } catch (error) {
      console.log("Error creating Booking", error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to create booking" });
    }
  });

  getUserBookings = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const Bookings = await this.bookingService.getUserBookings(userId);

      if (!Bookings) {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: "Bookings not found" });
        return;
      }

      res.status(HttpStatusCode.OK).json(Bookings);
    } catch (error) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch Bookings" });
    }
  });

  getBookingDetails = asyncHandler(async (req: Request, res: Response) => {
    try {
      const bookingId = req.params.id;
      const Bookings = await this.bookingService.getBookingDetails(bookingId);

      if (!Bookings) {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: "Bookings not found" });
        return;
      }

      res.status(HttpStatusCode.OK).json(Bookings);
    } catch (error) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch Bookings" });
    }
  });

  cancelBookingByuser = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    try {
      const cancelledBooking = await this.bookingService.cancelBookingByUser(bookingId);
      res.status(HttpStatusCode.OK).json({
        message: "Booking cancelled successfully",
        booking: cancelledBooking,
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to cancel booking" });
    }
  });
}