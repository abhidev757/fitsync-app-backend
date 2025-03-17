import { injectable } from "inversify";
import mongoose, { Error } from "mongoose";
import Trainer from "../../models/TrainerModel";
import { ITrainer, IBlockedTrainerResponse, IUnblockedTrainerResponse } from "../../types/trainer.types";
import { BaseRepository } from "../base/BaseRepository";
import { ITrainerRepository } from "../../interfaces/trainer/ITrainerRepository";




@injectable()
export class TrainerRepository extends BaseRepository<ITrainer> implements ITrainerRepository {
    private readonly TrainerModel = Trainer;

    constructor() {
        super(Trainer)
    }

    async findByEmail(email: string): Promise<ITrainer | null> {
        try{
            return await this.TrainerModel.findOne({email})
        } catch(err) {
            console.error('Error finding trainer by email:', err);
            throw new Error('Failer to find trainer by email')
        }
    }

    async register(trainerData: ITrainer): Promise<ITrainer | null> {
        try {
            const trainer = new this.TrainerModel(trainerData)
            return await trainer.save();
        } catch(err) {
            console.error('Error finding trainer by ID:', err);
            throw new Error('Failed to find trainer')
        }
    }

    async findById(trainerId: string): Promise<ITrainer | null> {
        try {
            return await this.TrainerModel.findById(trainerId);
        } catch (error) {
            console.error('Error finding trainer by ID:', error);
            throw new Error('Failed to find trainer');
        }
    }

    async update(userId: string, data: Partial<ITrainer>): Promise<ITrainer | null> {
            try {
                return await this.TrainerModel.findByIdAndUpdate(userId, { $set: data }, { new: true });
            } catch (error) {
                console.error('Error updating user:', error);
                throw new Error('Failed to update user');
            }
        }

        
}