import { inject, injectable } from "inversify";
import { ITrainerPaymentRepository } from "../../interfaces/trainer/repositories/ITrainerPaymentRepository";
import { WalletDetails } from "../../types/trainer.types";
import { INotificationService } from "../../interfaces/notification/services/INotificationService";
import mongoose from "mongoose";

@injectable()
export class TrainerPaymentService {
  constructor(
  @inject("ITrainerPaymentRepository") private trainerPaymentRepository: ITrainerPaymentRepository,
  @inject("INotificationService") private notificationService: INotificationService
) {}

  async getWalletDetails(trainerId: string): Promise<WalletDetails> {
    const [balance, transactions] = await Promise.all([
      this.trainerPaymentRepository.getTrainerBalance(trainerId),
      this.trainerPaymentRepository.getWalletTransactions(trainerId),
    ]);

    return {
      balance,
      transactions,
    };
  }

  async requestPayout(trainerId: string, amount: number): Promise<void> {
    const balance = await this.trainerPaymentRepository.getTrainerBalance(trainerId);
    if (balance < amount) {
        throw new Error("Insufficient balance");
    }
    await this.trainerPaymentRepository.createPayoutRequest(trainerId, amount);

    // Notify admin
    await this.notificationService.createNotification({
      recipientId: new mongoose.Types.ObjectId(trainerId), // Dummy ID since admin gets broadcasted
      recipientModel: "admin",
      type: "PAYOUT_REQUEST",
      message: `Trainer has requested a payout of $${amount}.`,
    });
  }
}