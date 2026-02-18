import { Request, Response } from "express";
import asyncHandler from 'express-async-handler';
import { inject, injectable } from "inversify";
import { ITrainerScheduleService } from "../../interfaces/trainer/services/ITrainerScheduleService";
import { ITimeSlotInput } from "../../types/timeSlots.types";
import { error, log } from "console";

@injectable()
export class TrainerScheduleController {
    constructor(@inject('ITrainerScheduleService') private readonly trainerScheduleService: ITrainerScheduleService) {}

    addTimeSlot = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { sessionType, startDate, endDate, time, price, numberOfSessions, userId } = req.body;

            const data: ITimeSlotInput = {
                trainerId: userId,
                sessionType,
                startDate,
                endDate,
                time,
                price,
                numberOfSessions,
            };
            await this.trainerScheduleService.addTimeSlot(data);
            res.status(200).json({ message: "Time Slot data saved successfully" });
        } catch (error) {
            console.error("Error saving time slot data:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    getTimeSlots = asyncHandler(async (req: Request, res: Response) => {
        try {
            let timeSlot = await this.trainerScheduleService.getTimeSlots();
            
            res.status(200).json(timeSlot);
        } catch (error) {
            console.error("Error fetching data:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    deleteTimeSlot = asyncHandler(async (req: Request, res: Response)=> {
        try {
            const {id} = req.params;

            if(!id) {
                res.status(400).json({message:"Time slot ID is required"})
                return;
            }

            const deleted = await this.trainerScheduleService.deleteTimeSlot(id);

            if(deleted) {
                res.status(200).json({message:"Time slot deleted successfully"})
            } else {
                res.status(404).json({message:"Time slot not found"})
            }
        } catch (err) {
            console.error("error deleting time slot",err)
            res.status(500).json({message:"Internal server error"})
        }
    })
    
}