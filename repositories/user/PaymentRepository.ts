import { injectable } from "inversify";
import { PaymentModel } from "../../models/PaymentModel";
import TrainerModel from "../../models/TrainerModel";
import WalletModel from "../../models/WalletModel";
import UserWalletModel, { IUserWalletTransaction } from "../../models/UserWallet";
import User from "../../models/UserModel";
import { Booking } from "../../models/bookingModel";
import { CreatePaymentDto, IPayment } from "../../types/user.types";
import { BaseRepository } from "../base/BaseRepository";
import { IPaymentRepository } from "../../interfaces/user/repositories/IPaymentRepository";

@injectable()
export class PaymentRepository extends BaseRepository<IPayment> implements IPaymentRepository {
    private readonly paymentModel = PaymentModel;
    private readonly TrainerModel = TrainerModel;
    private readonly WalletModel = WalletModel;
    private readonly UserWalletModel = UserWalletModel;
    private readonly UserModel = User;
    private readonly BookingModel = Booking;

    constructor() { super(PaymentModel); }

    async createPayment(paymentData: CreatePaymentDto): Promise<IPayment> {
        return this.paymentModel.create(paymentData);
    }

    async findPaymentByStripeId(stripePaymentId: string): Promise<any> {
        return await this.paymentModel.findOne({ stripePaymentId });
    }

    async creditTrainerWallet(trainerId: string, amount: number, sessionId: string, reason: string): Promise<void> {
        await this.TrainerModel.findByIdAndUpdate(trainerId, { $inc: { balance: amount } });
        await this.WalletModel.create({ trainerId, amount, type: "credit", sessionId, reason });
    }

    async getUserBalance(userId: string): Promise<number> {
        const user = await this.UserModel.findById(userId);
        return user?.balance ?? 0;
    }

    async getWalletTransactions(userId: string): Promise<IUserWalletTransaction[]> {
        return await this.UserWalletModel.find({ userId }).sort({ createdAt: -1 });
    }

    async debit(trainerId: string, amount: number, sessionId: string, reason: string): Promise<void> {
        const trainer = await this.TrainerModel.findById(trainerId);
        if (!trainer || trainer.balance < amount) throw new Error("Insufficient balance");

        await this.TrainerModel.findByIdAndUpdate(trainerId, { $inc: { balance: -amount } });
        await this.WalletModel.create({ trainerId, amount, type: "debit", sessionId, reason });

        const session = await this.BookingModel.findById(sessionId);
        if (!session) throw new Error("Session not found");
        const userId = session.userId;

        await this.UserModel.findByIdAndUpdate(userId, { $inc: { balance: amount } });
        await this.UserWalletModel.create({ userId, amount, type: "credit", sessionId, reason: `Refund: ${reason}` });
    }
}