import { DaySchedule, ITimeSlotBulkInput, ITimeSlotInput, ITimeSlots } from "../../../types/timeSlots.types";

export interface ITrainerScheduleRepository {
    addTimeSlot(data: ITimeSlotInput): Promise<ITimeSlots | null>;
    addBulkTimeSlots(slots: ITimeSlotInput[]): Promise<ITimeSlots[]>;
    findExistingSlot(trainerId: string, startDate: string, time: string): Promise<ITimeSlots | null>;
    getTimeSlots(): Promise<DaySchedule[]>;
    deleteTimeSlot(id: string): Promise<boolean>;
}