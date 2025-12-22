import { inject, injectable } from "inversify";
import { IBookingRepository } from "../../interfaces/user/repositories/IBookingRepository";
import { IPaymentRepository } from "../../interfaces/user/repositories/IPaymentRepository";
import { CreateBookingDto } from "../../types/user.types";
import { IBooking } from "../../models/bookingModel";
import mongoose from "mongoose";

@injectable()
export class BookingService {
  constructor(
    @inject("IBookingRepository") private bookingRepository: IBookingRepository,
    @inject("IPaymentRepository") private paymentRepository: IPaymentRepository
  ) {}

  async createBooking(bookingData: any): Promise<IBooking> {
    try {
      const validatedData = {
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        userId: bookingData.user || bookingData.userId,
        trainerId: bookingData.trainer || bookingData.trainerId,
        sessionTime: bookingData.sessionTime,
        startDate: bookingData.startDate,
        isPackage: bookingData.isPackage,
        paymentId: bookingData.paymentId,
        amount: bookingData.amount,
        status: "confirmed" as const,
      };

      if (!validatedData.userId || !validatedData.trainerId) {
        throw new Error("Missing required fields: userId or trainerId");
      }

      const processedData: CreateBookingDto = {
        ...validatedData,
        userId: new mongoose.Types.ObjectId(validatedData.userId),
        trainerId: new mongoose.Types.ObjectId(validatedData.trainerId),
        status: validatedData.status,
      };

      const booking = await this.bookingRepository.createBooking(processedData);

      await this.paymentRepository.creditTrainerWallet(
        processedData.trainerId.toString(),
        processedData.amount,
        booking._id.toString(),
        "Session Booked"
      );
      return booking.toObject();
    } catch (error) {
      console.error("Error creating booking:", error);
      throw new Error("Failed to create booking");
    }
  }

  async getUserBookings(userId: string): Promise<IBooking[]> {
    try {
      return await this.bookingRepository.findByUserId(userId);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      throw new Error("Failed to fetch user bookings");
    }
  }

  async getBookingDetails(bookingId: string): Promise<IBooking | null> {
    try {
      const booking = await this.bookingRepository.findByBookingId(bookingId);
      if (!booking) throw new Error("Booking not found");
      return booking;
    } catch (error) {
      console.error("Error fetching booking details:", error);
      throw new Error("Failed to fetch booking details");
    }
  }

  async cancelBookingByUser(bookingId: string): Promise<IBooking> {
    try {
      const booking = await this.bookingRepository.findByBookingId(bookingId);
      if (!booking) throw new Error("Booking not found");
      if (booking.status === "cancelled") throw new Error("Booking already cancelled");

      const updatedBooking = await this.bookingRepository.updateBookingStatus(bookingId, "cancelled");

      const trainerId =
        typeof booking.trainerId === "object"
          ? (booking.trainerId as { _id: mongoose.Types.ObjectId })._id.toString()
          : (booking.trainerId as mongoose.Types.ObjectId).toString();

      await this.paymentRepository.debit(
        trainerId,
        booking.amount,
        booking._id.toString(),
        "Session Cancelled"
      );

      return updatedBooking;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw new Error("Failed to cancel booking");
    }
  }
}