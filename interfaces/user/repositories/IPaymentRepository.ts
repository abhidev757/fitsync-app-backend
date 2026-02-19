import { IPayment, CreatePaymentDto } from "../../../types/user.types";
import { IUserWalletTransaction } from "../../../models/UserWallet";

export interface IPaymentRepository {
    createPayment(paymentData: CreatePaymentDto): Promise<IPayment>;
    findPaymentByStripeId(stripePaymentId: string): Promise<IPayment | null>;
    creditTrainerWallet(trainerId: string, amount: number, sessionId: string, reason: string): Promise<void>;
    getUserBalance(userId: string): Promise<number>;
    getWalletTransactions(userId: string): Promise<IUserWalletTransaction[]>;
    debit(trainerId: string, amount: number, sessionId: string, reason: string): Promise<void>;
    // debitUser(userId: string, amount: number, reason: string): Promise<void>; // Removed in previous steps by user, but let's check current file
    createPayoutRequest(userId: string, amount: number): Promise<any>;
}