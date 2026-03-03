import { injectable } from "inversify";
import mongoose, { Model } from "mongoose";
import UserFitness from "../../models/UserInfo";
import WaterLog, { IWaterLog } from "../../models/WaterLog";
import HealthData from "../../models/HealthDataModel";
import UserModel from "../../models/UserModel";
import { Booking } from "../../models/bookingModel";
import { IUserFitness } from "../../types/userInfo.types";
import { IFitnessData } from "../../types/fitness.types";
import { BaseRepository } from "../base/BaseRepository";
import { IFitnessRepository, DashboardData } from "../../interfaces/user/repositories/IFitnessRepository";

@injectable()
export class FitnessRepository extends BaseRepository<IUserFitness> implements IFitnessRepository {
    private readonly UserFitnessModel = UserFitness;
    private readonly WaterLogModel = WaterLog;
    private readonly HealthDataModel = HealthData;
    private readonly UserModel = UserModel;
    private readonly BookingModel = Booking;

    constructor() { super(UserFitness as unknown as Model<IUserFitness>); }

    async saveFitnessInfo(fitnessData: IUserFitness): Promise<IUserFitness | null> {
        try {
            const userFitness = new UserFitness(fitnessData);
            await userFitness.save();
            return userFitness;
        } catch (error) {
            console.error("Error saving fitness info:", error);
            throw new Error("Failed to save fitness info");
        }
    }

    async getFitnessInfo(userId: string): Promise<IUserFitness | null> {
        const fitnessData = await this.UserFitnessModel.findOne({ userId });
        if (!fitnessData) throw new Error("User fitness data not found");
        return fitnessData;
    }

    async updateFitnessInfo(userId: string, fitnessData: Partial<IUserFitness>): Promise<IUserFitness | null> {
        return await this.UserFitnessModel.findOneAndUpdate({ userId }, fitnessData, { new: true, upsert: true });
    }

    async findWaterLog(userId: string, date: string): Promise<IWaterLog | null> {
        return await this.WaterLogModel.findOne({ userId, date });
    }

    async upsertWaterLog(userId: string, date: string, waterGlasses: number): Promise<IWaterLog> {
        return await this.WaterLogModel.findOneAndUpdate({ userId, date }, { $set: { waterGlasses } }, { upsert: true, new: true });
    }

    async saveOrUpdate(userId: string, date: string, data: { steps: number; calories: number; sleepMinutes: number }): Promise<any> {
        return this.HealthDataModel.findOneAndUpdate({ userId, date }, { $set: data }, { upsert: true, new: true });
    }

    async getByDate(userId: string, date: string): Promise<IFitnessData | null> {
        return this.HealthDataModel.findOne({ userId, date });
    }

    async getDashboardData(userId: string, year: number, month: number): Promise<DashboardData> {
        // Month range (month is 0-indexed in JS Date)
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const [user, fitness, bookings] = await Promise.all([
            this.UserModel.findById(userId).select("name profileImageUrl").lean(),
            this.UserFitnessModel.findOne({ userId }).lean(),
            this.BookingModel.find({
                userId: new mongoose.Types.ObjectId(userId),
                startDate: { $gte: start, $lte: end },
                status: { $nin: ["cancelled"] },
            }).select("startDate").lean(),
        ]);

        const appointmentDays = [...new Set(
            bookings.map((b) => new Date(b.startDate).getDate())
        )];

        return {
            user: {
                name: user?.name ?? "User",
                profileImageUrl: (user as any)?.profileImageUrl ?? null,
            },
            fitness: fitness
                ? {
                    age: (fitness as any).age,
                    sex: (fitness as any).sex,
                    weight: (fitness as any).weight,
                    height: (fitness as any).height,
                    targetWeight: (fitness as any).targetWeight,
                    activity: (fitness as any).activity,
                }
                : null,
            appointmentDays,
        };
    }
}
