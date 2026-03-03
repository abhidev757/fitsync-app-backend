import { inject, injectable } from "inversify";
import { ITrainerScheduleRepository } from "../../interfaces/trainer/repositories/ITrainerScheduleRepository";
import {
  DaySchedule,
  ITimeSlotBulkInput,
  ITimeSlotInput,
  ITimeSlots,
} from "../../types/timeSlots.types";
import mongoose from "mongoose";

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** "HH:MM" → total minutes from midnight */
const toMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** total minutes → "HH:MM" */
const fromMinutes = (m: number): number => m;

/** Format minutes-from-midnight as "H:MM AM/PM" display */
const formatTime = (mins: number): string => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
};

@injectable()
export class TrainerScheduleService {
  constructor(
    @inject("ITrainerScheduleRepository")
    private trainerScheduleRepository: ITrainerScheduleRepository
  ) {}

  // ── Quick Add ──────────────────────────────────────────────────
  async addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null> {
    // 1. Date must not be in the past (allow today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotDate = new Date(data.startDate);
    if (slotDate < today) {
      throw new Error("Date cannot be in the past.");
    }

    // 2. Parse times from "HH:MM AM/PM - HH:MM AM/PM" format
    const [startStr, endStr] = data.time.split(" - ");
    if (!startStr || !endStr) {
      throw new Error("Invalid time range format.");
    }

    // 3. Start must be before end
    const parse12 = (t: string): number => {
      const [time, ampm] = t.trim().split(" ");
      let [h, m] = time.split(":").map(Number);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };
    if (parse12(startStr) >= parse12(endStr)) {
      throw new Error("End time must be after start time.");
    }

    // 4. Price
    if (!data.price || parseFloat(data.price) <= 0) {
      throw new Error("Price must be greater than 0.");
    }

    // 5. Buffer (optional)
    if (data.bufferMinutes !== undefined && (data.bufferMinutes < 0 || data.bufferMinutes > 120)) {
      throw new Error("Buffer time must be between 0 and 120 minutes.");
    }

    // 6. Duplicate check – same trainer, same date, same time
    const existing = await this.trainerScheduleRepository.findExistingSlot(
      data.trainerId.toString(),
      data.startDate as unknown as string,
      data.time
    );
    if (existing) {
      throw new Error("A slot with this date and time already exists. Please choose a different time.");
    }

    return this.trainerScheduleRepository.addTimeSlot(data);
  }

  // ── Bulk Add ───────────────────────────────────────────────────
  async addBulkTimeSlots(input: ITimeSlotBulkInput): Promise<ITimeSlots[]> {
    const {
      trainerId, days, blockStart, blockEnd,
      durationMinutes, lunchStart, lunchEnd, price,
    } = input;

    if (!days || days.length === 0) throw new Error("Select at least one day.");
    if (durationMinutes < 15) throw new Error("Session duration must be at least 15 minutes.");

    const blockStartMin = toMinutes(blockStart);
    const blockEndMin = toMinutes(blockEnd);
    if (blockStartMin >= blockEndMin) throw new Error("Block end must be after block start.");
    if (blockEndMin - blockStartMin < durationMinutes) throw new Error("Time block is too short for the selected duration.");

    if (!price || parseFloat(price) <= 0) throw new Error("Price must be greater than 0.");

    const lunchStartMin = lunchStart ? toMinutes(lunchStart) : null;
    const lunchEndMin = lunchEnd ? toMinutes(lunchEnd) : null;

    // Generate dates: next 4 weeks (28 days from today)
    const generatedSlots: ITimeSlotInput[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      for (const dayName of days) {
        const targetDow = DAY_MAP[dayName];
        if (targetDow === undefined) continue;

        // Find the next occurrence of this day of week from today + weekOffset*7
        const base = new Date(today);
        base.setDate(base.getDate() + weekOffset * 7);
        const diff = (targetDow - base.getDay() + 7) % 7;
        // For week 0, also include today if diff=0 and day matches
        const slotDate = new Date(base);
        slotDate.setDate(slotDate.getDate() + diff);

        // Don't add past dates
        if (slotDate < today) continue;

        const dateStr = slotDate.toISOString().split("T")[0]; // YYYY-MM-DD

        // Walk through the time block
        let cursor = blockStartMin;
        while (cursor + durationMinutes <= blockEndMin) {
          const slotEnd = cursor + durationMinutes;

          // Skip overlapping lunch
          if (
            lunchStartMin !== null &&
            lunchEndMin !== null &&
            cursor < lunchEndMin &&
            slotEnd > lunchStartMin
          ) {
            cursor = lunchEndMin;
            continue;
          }

          const timeLabel = `${formatTime(cursor)} - ${formatTime(slotEnd)}`;

          generatedSlots.push({
            trainerId,
            sessionType: "Quick Add",
            time: timeLabel,
            startDate: dateStr,
            endDate: dateStr,
            price,
          });

          cursor = slotEnd;
        }
      }
    }

    if (generatedSlots.length === 0) {
      throw new Error("No valid slots could be generated with the given settings.");
    }

    return this.trainerScheduleRepository.addBulkTimeSlots(generatedSlots);
  }

  // ── Existing ───────────────────────────────────────────────────
  async getTimeSlots(): Promise<DaySchedule[]> {
    try {
      return await this.trainerScheduleRepository.getTimeSlots();
    } catch (err) {
      throw new Error("Failed to fetch time slots");
    }
  }

  async deleteTimeSlot(id: string): Promise<boolean> {
    const success = await this.trainerScheduleRepository.deleteTimeSlot(id);
    if (!success) throw new Error("Time slot not found or already deleted");
    return success;
  }
}