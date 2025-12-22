import { inject, injectable } from "inversify";
import { ITrainerScheduleRepository } from "../../interfaces/trainer/repositories/ITrainerScheduleRepository";
import { DaySchedule, ITimeSlotInput, ITimeSlots } from "../../types/timeSlots.types";

@injectable()
export class TrainerScheduleService {
  constructor(
  @inject("ITrainerScheduleRepository") private trainerScheduleRepository: ITrainerScheduleRepository
) {}

  async addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null> {
    try {
      const timeSlot = await this.trainerScheduleRepository.addTimeSlot(data);
      return timeSlot;
    } catch (err) {
      console.log(err);
      throw new Error("Failed to add Time slot");
    }
  }

  async getTimeSlots(): Promise<DaySchedule[]> {
    try {
      const timeSlot = await this.trainerScheduleRepository.getTimeSlots();
      return timeSlot;
    } catch (err) {
      console.log(err);
      throw new Error("Failed to add Time slot");
    }
  }
}