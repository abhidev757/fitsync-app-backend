import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { inject, injectable } from "inversify";
import { ITrainerScheduleService } from "../../interfaces/trainer/services/ITrainerScheduleService";
import { ITimeSlotBulkInput, ITimeSlotInput } from "../../types/timeSlots.types";

@injectable()
export class TrainerScheduleController {
  constructor(
    @inject("ITrainerScheduleService")
    private readonly trainerScheduleService: ITrainerScheduleService
  ) {}

  // ── Quick Add ────────────────────────────────────────────────
  addTimeSlot = asyncHandler(async (req: Request, res: Response) => {
    const { sessionType, startDate, endDate, time, price, bufferMinutes, userId } = req.body;

    if (!startDate || !time || !price) {
      res.status(400).json({ message: "startDate, time, and price are required." });
      return;
    }

    const data: ITimeSlotInput = {
      trainerId: userId,
      sessionType: sessionType ?? "Quick Add",
      startDate,
      endDate: endDate ?? startDate,
      time,
      price,
      bufferMinutes: bufferMinutes ? Number(bufferMinutes) : undefined,
    };

    try {
      await this.trainerScheduleService.addTimeSlot(data);
      res.status(200).json({ message: "Time slot saved successfully." });
    } catch (error: any) {
      console.error("Error saving time slot:", error);
      const status = error.message.includes("past") || error.message.includes("Price") ? 400 : 500;
      res.status(status).json({ message: error.message ?? "Internal Server Error" });
    }
  });

  // ── Bulk Add ─────────────────────────────────────────────────
  addBulkTimeSlots = asyncHandler(async (req: Request, res: Response) => {
    const { days, blockStart, blockEnd, durationMinutes, lunchStart, lunchEnd, price, userId } = req.body;

    if (!days?.length || !blockStart || !blockEnd || !durationMinutes || !price) {
      res.status(400).json({ message: "days, blockStart, blockEnd, durationMinutes, and price are required." });
      return;
    }

    const input: ITimeSlotBulkInput = {
      trainerId: userId,
      days,
      blockStart,
      blockEnd,
      durationMinutes: Number(durationMinutes),
      lunchStart: lunchStart || undefined,
      lunchEnd: lunchEnd || undefined,
      price,
    };

    try {
      const created = await this.trainerScheduleService.addBulkTimeSlots(input);
      res.status(200).json({ message: `${created.length} time slots created.`, count: created.length });
    } catch (error: any) {
      console.error("Bulk time slot error:", error);
      res.status(400).json({ message: error.message ?? "Internal Server Error" });
    }
  });

  // ── Get Time Slots ───────────────────────────────────────────
  getTimeSlots = asyncHandler(async (req: Request, res: Response) => {
    try {
      const timeSlots = await this.trainerScheduleService.getTimeSlots();
      res.status(200).json(timeSlots);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // ── Delete Time Slot ─────────────────────────────────────────
  deleteTimeSlot = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "Time slot ID is required" });
      return;
    }
    try {
      const deleted = await this.trainerScheduleService.deleteTimeSlot(id);
      if (deleted) {
        res.status(200).json({ message: "Time slot deleted successfully" });
      } else {
        res.status(404).json({ message: "Time slot not found" });
      }
    } catch (err: any) {
      console.error("Error deleting time slot", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}