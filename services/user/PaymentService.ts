import { inject, injectable } from "inversify";
import { IPaymentRepository } from "../../interfaces/user/repositories/IPaymentRepository";
import { PaymentIntentMetadata } from "../../types/user.types";
import { UserWalletDetails } from "../../types/trainer.types";
import { INotificationService } from "../../interfaces/notification/services/INotificationService";
import Stripe from "stripe";
import mongoose from "mongoose";

@injectable()
export class PaymentService {
  private stripe: Stripe;
  constructor(
    @inject("IPaymentRepository") private paymentRepository: IPaymentRepository,
    @inject("StripeSecretKey") private readonly stripeSecretKey: string,
    @inject("StripeConfig") private readonly config: Stripe.StripeConfig,
    @inject("INotificationService") private notificationService: INotificationService
  ) {
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }
    this.stripe = new Stripe(stripeSecretKey, config);
  }

  async createPaymentIntent(amount: number, trainerId: string, metadata: PaymentIntentMetadata): Promise<Stripe.PaymentIntent> {
    const userId = new mongoose.Types.ObjectId(metadata.userId);
    const trainerObjectId = new mongoose.Types.ObjectId(trainerId);

    const dbPayment = await this.paymentRepository.createPayment({
      userId,
      trainerId: trainerObjectId,
      amount: amount,
      currency: "usd",
      status: "requires_payment_method",
      metadata,
      stripePaymentId: "temp_" + new Date().getTime(),
    });

    const stripePI = await this.stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        ...metadata,
        internalPaymentId: dbPayment._id.toString(),
      },
    });

    return stripePI;
  }

  async getWalletDetails(userId: string): Promise<UserWalletDetails> {
    const [balance, transactions] = await Promise.all([
      this.paymentRepository.getUserBalance(userId),
      this.paymentRepository.getWalletTransactions(userId),
    ]);

    return { balance, transactions };
  }

  async requestPayout(userId: string, amount: number): Promise<void> {
    await this.paymentRepository.createPayoutRequest(userId, amount);
    
    // Notify admin
    await this.notificationService.createNotification({
      recipientId: new mongoose.Types.ObjectId(userId),
      recipientModel: "admin",
      type: "PAYOUT_REQUEST",
      message: `User has requested a payout of ₹${amount}.`,
    });
  }
}