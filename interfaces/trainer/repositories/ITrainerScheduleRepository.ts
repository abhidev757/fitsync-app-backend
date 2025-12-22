import { DaySchedule, ITimeSlotInput, ITimeSlots } from "../../../types/timeSlots.types";

export interface ITrainerScheduleRepository {
    addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null>;
    getTimeSlots(): Promise<DaySchedule[]>;
}