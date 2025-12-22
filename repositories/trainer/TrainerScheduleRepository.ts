import { injectable } from "inversify";
import TimeSlots from "../../models/timeSlotsModel";
import { ITimeSlots, DaySchedule, ITimeSlotInput } from "../../types/timeSlots.types";
import { BaseRepository } from "../base/BaseRepository";
import { ITrainerScheduleRepository } from "../../interfaces/trainer/repositories/ITrainerScheduleRepository";

@injectable()
export class TrainerScheduleRepository extends BaseRepository<ITimeSlots> implements ITrainerScheduleRepository {
    private readonly TimeSlotModel = TimeSlots;

    constructor() { 
        // @ts-ignore - Similar cast fix for Mongoose models might be needed here
        super(TimeSlots); 
    }

    async addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null> {
        try {
            const parseDate = (dateString: string): Date => {
                const [day, month, year] = dateString.split("/");
                return new Date(`${year}-${month}-${day}`);
            };
            const timeSlot = new this.TimeSlotModel({
                ...data,
                startDate: parseDate(data.startDate as unknown as string),
                endDate: parseDate(data.endDate as unknown as string),
            });
            return await timeSlot.save();
        } catch (err) {
            console.error("Error saving time slot:", err);
            throw new Error("Failed to save time slot");
        }
    }

    async getTimeSlots(): Promise<DaySchedule[]> {
        try {
            const results = await this.TimeSlotModel.aggregate([
                {
                    $project: {
                        date: { $dateToString: { format: "%d %B %Y", date: "$startDate" } },
                        time: 1,
                        sessionType: 1,
                    },
                },
                {
                    $group: {
                        _id: "$date",
                        slots: { $push: { time: "$time", type: "$sessionType" } },
                    },
                },
                {
                    $project: { _id: 0, date: "$_id", slots: 1 },
                },
                { $sort: { date: 1 } },
            ]);
            return results;
        } catch (err) {
            console.error("Error fetching time slots:", err);
            throw new Error("Failed to fetch time slots");
        }
    }
}