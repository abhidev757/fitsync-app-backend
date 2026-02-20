import { inject, injectable } from "inversify";
import { ITrainerBookingRepository } from "../../interfaces/trainer/repositories/ITrainerBookingRepository";
import { ITrainerPaymentRepository } from "../../interfaces/trainer/repositories/ITrainerPaymentRepository";
import { IBooking } from "../../models/bookingModel";
import { INotificationService } from "../../interfaces/notification/services/INotificationService";
import mongoose from "mongoose";

@injectable()
export class TrainerBookingService {
  constructor(
  @inject("ITrainerBookingRepository") private trainerBookingRepository: ITrainerBookingRepository,
  @inject("ITrainerPaymentRepository") private trainerPaymentRepository: ITrainerPaymentRepository,
  @inject("INotificationService") private notificationService: INotificationService
) {}

  async getTrainerBookings(trainerId: string): Promise<IBooking[]> {
    try {
      const bookings = await this.trainerBookingRepository.findByTrainerId(trainerId);
      return bookings.map((booking) => booking);
    } catch (error) {
      console.error("Error fetching trainer bookings:", error);
      throw new Error("Failed to fetch trainer bookings");
    }
  }

  async getBookingDetails(bookingId: string): Promise<IBooking | null> {
    try {
      const booking = await this.trainerBookingRepository.findByBookingId(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }
      return booking;
    } catch (error) {
      console.error("Error fetching booking details:", error);
      throw new Error("Failed to fetch booking details");
    }
  }

  async cancelBookingByTrainer(bookingId: string): Promise<IBooking> {
    try {
      const booking = await this.trainerBookingRepository.findByBookingId(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }
      if (booking.status === "cancelled") {
        throw new Error("Booking already cancelled");
      }

      const updatedBooking = await this.trainerBookingRepository.updateBookingStatus(
        bookingId,
        "cancelled"
      );

      const trainerId =
        typeof booking.trainerId === "object"
          ? (
              booking.trainerId as { _id: mongoose.Types.ObjectId }
            )._id.toString()
          : (booking.trainerId as mongoose.Types.ObjectId).toString();

      await this.trainerPaymentRepository.debit(
        trainerId,
        booking.amount,
        booking._id.toString(),
        "Session Cancelled"
      );

      const userId =
        typeof booking.userId === "object"
          ? (booking.userId as { _id: mongoose.Types.ObjectId })._id.toString()
          : (booking.userId as mongoose.Types.ObjectId)?.toString();

      if (userId) {
        await this.notificationService.createNotification({
          recipientId: new mongoose.Types.ObjectId(userId),
          recipientModel: "user",
          type: "BOOKING_CANCELLED",
          message: "Your booking was cancelled by the trainer.",
          relatedId: booking._id as mongoose.Types.ObjectId,
        });
      }

      return updatedBooking;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw new Error("Failed to cancel booking");
    }
  }
}