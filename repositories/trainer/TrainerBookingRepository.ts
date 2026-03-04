import { injectable } from "inversify";
import mongoose from "mongoose";
import { Booking, IBooking } from "../../models/bookingModel";
import { BaseRepository } from "../base/BaseRepository";
import { ITrainerBookingRepository, TrainerDashboardStats } from "../../interfaces/trainer/repositories/ITrainerBookingRepository";
import Trainer from "../../models/TrainerModel";
import WalletTransaction from "../../models/WalletModel";

@injectable()
export class TrainerBookingRepository extends BaseRepository<IBooking> implements ITrainerBookingRepository {
    private readonly BookingModel = Booking;
    private readonly TrainerModel = Trainer;
    private readonly WalletModel = WalletTransaction;

    constructor() { super(Booking); }

    async findByTrainerId(trainerId: string): Promise<IBooking[]> {
        return await this.BookingModel.find({ trainerId }).sort({ createdAt: -1 }).populate("userId").lean().exec();
    }

    async findByBookingId(bookingId: string): Promise<IBooking | null> {
        return await this.BookingModel.findById(bookingId)
            .populate("userId", "name email phone")
            .populate("trainerId", "name email phone profileImageUrl yearsOfExperience")
            .exec();
    }

    async updateBookingStatus(bookingId: string, status: string): Promise<IBooking> {
        const updatedBooking = await this.BookingModel.findByIdAndUpdate(bookingId, { status }, { new: true });
        if (!updatedBooking) throw new Error("Booking not found");
        return updatedBooking;
    }

    async getDashboardStats(trainerId: string): Promise<TrainerDashboardStats> {
        const now = new Date();
        const trainerObjId = new mongoose.Types.ObjectId(trainerId);

        // Build last-6-month labels and date range
        const monthLabels: string[] = [];
        const monthlyEarnings = Array(6).fill(0);
        const months: { start: Date; end: Date; label: string }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const label = d.toLocaleString("default", { month: "short" });
            monthLabels.push(label);
            months.push({ start: d, end, label });
        }

        const [clientAgg, upcomingCount, totalSessions, upcomingList, trainer, earningsAgg] = await Promise.all([
            // Distinct clients
            this.BookingModel.aggregate([
                { $match: { trainerId: trainerObjId } },
                { $group: { _id: "$userId" } },
                { $count: "total" },
            ]),
            // Upcoming session count
            this.BookingModel.countDocuments({
                trainerId: trainerObjId,
                status: "confirmed",
                startDate: { $gte: now },
            }),
            // Total sessions
            this.BookingModel.countDocuments({ trainerId: trainerObjId }),
            // Upcoming sessions list (up to 5)
            this.BookingModel.find({
                trainerId: trainerObjId,
                status: "confirmed",
                startDate: { $gte: now },
            })
                .sort({ startDate: 1 })
                .limit(5)
                .populate("userId", "name profileImageUrl")
                .lean(),
            // Trainer wallet balance
            this.TrainerModel.findById(trainerId).select("balance").lean(),
            // Monthly earnings (credit transactions in last 6 months)
            this.WalletModel.aggregate([
                {
                    $match: {
                        trainerId: trainerObjId,
                        type: "credit",
                        createdAt: { $gte: months[0].start },
                    },
                },
                {
                    $group: {
                        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                        total: { $sum: "$amount" },
                    },
                },
            ]),
        ]);

        // Map monthly earnings
        for (const item of earningsAgg) {
            const itemDate = new Date(item._id.year, item._id.month - 1, 1);
            months.forEach((m, idx) => {
                if (itemDate >= m.start && itemDate < m.end) {
                    monthlyEarnings[idx] = item.total;
                }
            });
        }


        const upcomingSessionList = upcomingList.map((b: any) => {
            const start = new Date(b.startDate);
            return {
                clientName: b.userId?.name ?? "Unknown",
                clientAvatar: b.userId?.profileImageUrl ?? null,
                date: start.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                time: b.sessionTime ?? start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                status: b.status,
            };
        });

        return {
            totalClients: clientAgg[0]?.total ?? 0,
            upcomingCount,
            totalSessions,
            walletBalance: (trainer as any)?.balance ?? 0,
            upcomingList: upcomingSessionList,
            monthlyEarnings,
            monthLabels,
        };
    }
}