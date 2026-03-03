import { injectable } from "inversify";
import TimeSlots from "../../models/timeSlotsModel";
import { ITimeSlots, DaySchedule, ITimeSlotInput } from "../../types/timeSlots.types";
import { BaseRepository } from "../base/BaseRepository";
import { ITrainerScheduleRepository } from "../../interfaces/trainer/repositories/ITrainerScheduleRepository";

@injectable()
export class TrainerScheduleRepository
  extends BaseRepository<ITimeSlots>
  implements ITrainerScheduleRepository
{
  private readonly TimeSlotModel = TimeSlots;

  constructor() {
    super(TimeSlots);
  }

  // Parse YYYY-MM-DD coming from the new front-end
  private parseDate(dateStr: string): Date {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) throw new Error(`Invalid date: ${dateStr}`);
    return d;
  }

  async findExistingSlot(trainerId: string, startDate: string, time: string): Promise<ITimeSlots | null> {
    try {
      const date = this.parseDate(startDate);
      // Match the same calendar day
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
      return await this.TimeSlotModel.findOne({
        trainerId,
        time,
        startDate: { $gte: dayStart, $lte: dayEnd },
      });
    } catch {
      return null;
    }
  }

  async addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null> {
    try {
      const timeSlot = new this.TimeSlotModel({
        ...data,
        startDate: this.parseDate(data.startDate as unknown as string),
        endDate: this.parseDate(data.endDate as unknown as string),
      });
      return await timeSlot.save();
    } catch (err: any) {
      if (err?.code === 11000) throw new Error("This time slot already exists for the selected date.");
      console.error("Error saving time slot:", err);
      throw new Error("Failed to save time slot");
    }
  }

  async addBulkTimeSlots(slots: ITimeSlotInput[]): Promise<ITimeSlots[]> {
    try {
      const docs = slots.map((s) => ({
        ...s,
        startDate: this.parseDate(s.startDate as unknown as string),
        endDate: this.parseDate(s.endDate as unknown as string),
      }));
      // ordered:false → continue inserting even if some duplicates exist
      const result = await this.TimeSlotModel.insertMany(docs, { ordered: false });
      return result as unknown as ITimeSlots[];
    } catch (err: any) {
      // Partial success: some inserted, some duplicates skipped
      if (err?.code === 11000 || err?.name === "BulkWriteError") {
        const inserted = err.insertedDocs ?? [];
        if (inserted.length > 0) return inserted as unknown as ITimeSlots[];
        throw new Error("All slots already exist for the selected days and times.");
      }
      console.error("Error bulk-saving time slots:", err);
      throw new Error("Failed to save bulk time slots");
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
            slots: {
              $push: { id: "$_id", time: "$time", type: "$sessionType" },
            },
          },
        },
        { $project: { _id: 0, date: "$_id", slots: 1 } },
        { $sort: { date: 1 } },
      ]);
      return results;
    } catch (err) {
      console.error("Error fetching time slots:", err);
      throw new Error("Failed to fetch time slots");
    }
  }

  async deleteTimeSlot(id: string): Promise<boolean> {
    try {
      const res = await this.TimeSlotModel.findByIdAndDelete(id);
      return res !== null;
    } catch (err) {
      console.error("Error deleting time slot", err);
      throw new Error("Failed to delete time slot");
    }
  }
}
