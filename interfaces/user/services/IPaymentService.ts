import Stripe from "stripe";
import { PaymentIntentMetadata } from "../../../types/user.types";
import { UserWalletDetails } from "../../../types/trainer.types";

export interface IPaymentService {
    createPaymentIntent(amount: number, trainerId: string, metadata: PaymentIntentMetadata): Promise<Stripe.PaymentIntent>;
    getWalletDetails(userId: string): Promise<UserWalletDetails>;
}