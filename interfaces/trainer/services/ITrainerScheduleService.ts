import { DaySchedule, ITimeSlotInput, ITimeSlots } from "../../../types/timeSlots.types";

export interface ITrainerScheduleService {
    addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null>;
    getTimeSlots(): Promise<DaySchedule[]>;
}