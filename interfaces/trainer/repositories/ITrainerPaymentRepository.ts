import { IWalletTransaction } from "../../../models/WalletModel";

export interface ITrainerPaymentRepository {
    getTrainerBalance(trainerId: string): Promise<number>;
    getWalletTransactions(trainerId: string): Promise<IWalletTransaction[]>;
    debit(trainerId: string, amount: number, sessionId: string, reason: string): Promise<void>;
    createPayoutRequest(trainerId: string, amount: number): Promise<void>;
}