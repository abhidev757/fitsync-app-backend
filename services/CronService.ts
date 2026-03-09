import { inject, injectable } from "inversify";
import cron from "node-cron";
import { IBookingRepository } from "../interfaces/user/repositories/IBookingRepository";
import { IPaymentRepository } from "../interfaces/user/repositories/IPaymentRepository";
import { INotificationService } from "../interfaces/notification/services/INotificationService";
import mongoose from "mongoose";

@injectable()
export class CronService {
  constructor(
    @inject("IBookingRepository") private bookingRepository: IBookingRepository,
    @inject("IPaymentRepository") private paymentRepository: IPaymentRepository,
    @inject("INotificationService") private notificationService: INotificationService
  ) {}

  public startCronJobs() {
    console.log("[CronService] Initializing scheduled tasks...");
    
    // Run every day at midnight (00:00)
    cron.schedule("0 0 * * *", async () => {
      console.log("[CronService] Running daily auto-cancel job for expired bookings...");
      try {
        await this.autoCancelExpiredBookings();
      } catch (error) {
        console.error("[CronService] Error running auto-cancel job:", error);
      }
    });

    // Optional: For testing purposes you can uncomment this to run it every minute
    // cron.schedule("* * * * *", async () => {
    //   console.log("[CronService - TEST] Running auto-cancel job every minute...");
    //   try {
    //     await this.autoCancelExpiredBookings();
    //   } catch (error) {
    //     console.error("[CronService - TEST] Error:", error);
    //   }
    // });
  }

  private async autoCancelExpiredBookings() {
    // Fetch bookings that were scheduled for before today and are still 'confirmed'
    const today = new Date();
    const expiredBookings = await this.bookingRepository.findExpiredBookings(today);

    if (expiredBookings.length === 0) {
      console.log("[CronService] No expired bookings found to cancel.");
      return;
    }

    console.log(`[CronService] Found ${expiredBookings.length} expired bookings. Processing cancellations...`);

    for (const booking of expiredBookings) {
      try {
        const bookingId = booking._id.toString();
        const trainerId = booking.trainerId.toString();
        const userId = booking.userId.toString();

        // 1. Update status to 'cancelled'
        await this.bookingRepository.updateBookingStatus(bookingId, "cancelled");

        // 2. Refund logic: Debit the trainer, credit the user
        await this.paymentRepository.debit(
          trainerId,
          booking.amount,
          bookingId,
          "Session Cancelled (Auto - Not Conducted)"
        );

        // 3. Notify User
        await this.notificationService.createNotification({
          recipientId: new mongoose.Types.ObjectId(userId),
          recipientModel: "user",
          type: "BOOKING_CANCELLED",
          message: `Your booking with ${booking.clientName} was auto-cancelled because the session was not conducted. You have been refunded ${booking.amount}.`,
          relatedId: booking._id as mongoose.Types.ObjectId,
        });

        // 4. Notify Trainer
        await this.notificationService.createNotification({
          recipientId: new mongoose.Types.ObjectId(trainerId),
          recipientModel: "trainer",
          type: "BOOKING_CANCELLED",
          message: `Your booking with ${booking.clientName} was auto-cancelled because the session was not conducted. The session amount has been debited.`,
          relatedId: booking._id as mongoose.Types.ObjectId,
        });

        console.log(`[CronService] Successfully processed auto-cancellation for booking ${bookingId}`);
      } catch (error) {
        console.error(`[CronService] Failed to process cancellation for booking ${booking._id}:`, error);
      }
    }
  }
}
