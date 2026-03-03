import { DaySchedule, ITimeSlotBulkInput, ITimeSlotInput, ITimeSlots } from "../../../types/timeSlots.types";

export interface ITrainerScheduleService {
    addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null>;
    addBulkTimeSlots(input: ITimeSlotBulkInput): Promise<ITimeSlots[]>;
    getTimeSlots(): Promise<DaySchedule[]>;
    deleteTimeSlot(id: string): Promise<boolean>;
}