import { inject, injectable } from "inversify";
import cron from "node-cron";
import { IBookingRepository } from "../interfaces/user/repositories/IBookingRepository";
import { IPaymentRepository } from "../interfaces/user/repositories/IPaymentRepository";
import { INotificationService } from "../interfaces/notification/services/INotificationService";
import mongoose from "mongoose";
import TimeSlots from "../models/timeSlotsModel";

@injectable()
export class CronService {
  constructor(
    @inject("IBookingRepository") private bookingRepository: IBookingRepository,
    @inject("IPaymentRepository") private paymentRepository: IPaymentRepository,
    @inject("INotificationService") private notificationService: INotificationService
  ) {}

  public startCronJobs() {
    console.log("[CronService] Initializing scheduled tasks...");
    
    // Run immediately on boot to catch up on any missed jobs
    this.autoCancelExpiredBookings().catch(err => {
      console.error("[CronService] Error during startup auto-cancel:", err);
    });
    this.autoDeleteExpiredSlots().catch(err => {
      console.error("[CronService] Error during startup slot deletion:", err);
    });
    
    // Run every hour at the top of the hour (e.g. 1:00, 2:00)
    cron.schedule("0 * * * *", async () => {
      console.log("[CronService] Running hourly jobs...");
      try {
        await this.autoCancelExpiredBookings();
      } catch (error) {
        console.error("[CronService] Error running auto-cancel job:", error);
      }
      try {
        await this.autoDeleteExpiredSlots();
      } catch (error) {
        console.error("[CronService] Error running auto-delete slots job:", error);
      }
    });
  }

  private async autoDeleteExpiredSlots() {
    const allSlots = await TimeSlots.find({ isBooked: false });
    if (!allSlots || allSlots.length === 0) return;

    const now = new Date();
    const boundary = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const expiredSlotIds: mongoose.Types.ObjectId[] = [];

    for (const slot of allSlots) {
      const slotDate = new Date(slot.startDate);
      const timeParts = slot.time.split('-').map(p => p.trim());
      const endTimeStr = timeParts.length > 1 ? timeParts[1] : timeParts[0];

      const match = endTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        slotDate.setHours(hours, minutes, 0, 0);
      }

      // If the slot ended more than 24 hours ago
      if (slotDate < boundary) {
        expiredSlotIds.push(slot._id as mongoose.Types.ObjectId);
      }
    }

    if (expiredSlotIds.length > 0) {
      console.log(`[CronService] Found ${expiredSlotIds.length} expired time slots (>24h). Deleting...`);
      await TimeSlots.deleteMany({ _id: { $in: expiredSlotIds } });
      console.log(`[CronService] Successfully deleted expired time slots.`);
    }
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
