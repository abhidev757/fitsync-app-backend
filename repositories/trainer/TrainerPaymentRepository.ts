import { injectable } from "inversify";
import { IWalletTransaction } from "../../models/WalletModel";
import WalletModel from "../../models/WalletModel";
import UserWalletModel from "../../models/UserWallet";
import Trainer from "../../models/TrainerModel";
import User from "../../models/UserModel";
import { Booking } from "../../models/bookingModel";
import { BaseRepository } from "../base/BaseRepository";
import { ITrainerPaymentRepository } from "../../interfaces/trainer/repositories/ITrainerPaymentRepository";
import PayoutRequest from "../../models/PayoutRequestModel";

@injectable()
export class TrainerPaymentRepository extends BaseRepository<any> implements ITrainerPaymentRepository {
    private readonly WalletModel = WalletModel;
    private readonly TrainerModel = Trainer;
    private readonly BookingModel = Booking;
    private readonly UserModel = User;
    private readonly UserWalletModel = UserWalletModel;
    private readonly PayoutRequestModel = PayoutRequest;

    constructor() { super(WalletModel); }

    async getTrainerBalance(trainerId: string): Promise<number> {
        const trainer = await this.TrainerModel.findById(trainerId);
        return trainer?.balance ?? 0;
    }

    async getWalletTransactions(trainerId: string): Promise<IWalletTransaction[]> {
        return await this.WalletModel.find({ trainerId }).sort({ createdAt: -1 });
    }

    async debit(trainerId: string, amount: number, sessionId: string, reason: string): Promise<void> {
        const trainer = await this.TrainerModel.findById(trainerId);
        if (!trainer || trainer.balance < amount) {
            throw new Error("Insufficient balance");
        }

        await this.TrainerModel.findByIdAndUpdate(trainerId, { $inc: { balance: -amount } });

        await this.WalletModel.create({
            trainerId,
            amount,
            type: "debit",
            sessionId,
            reason,
        });

        // Fetch session to get userId
        const session = await this.BookingModel.findById(sessionId);
        if (!session) throw new Error("Session not found");

        const userId = session.userId;

        // Credit to user
        await this.UserModel.findByIdAndUpdate(userId, { $inc: { balance: amount } });

        // Log user credit transaction
        await this.UserWalletModel.create({
            userId,
            amount,
            type: "credit",
            sessionId,
            reason: `Refund: ${reason}`,
        });
    }

    async createPayoutRequest(trainerId: string, amount: number): Promise<void> {
        await this.PayoutRequestModel.create({
            trainerId,
            amount,
            status: 'pending'
        });
    }
}