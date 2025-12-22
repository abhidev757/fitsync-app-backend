import { injectable } from "inversify";
import Trainer from "../../models/TrainerModel";
import { ITrainer } from "../../types/trainer.types";
import { BaseRepository } from "../base/BaseRepository";
import { ITrainerAuthRepository } from "../../interfaces/trainer/repositories/ITrainerAuthRepository";

@injectable()
export class TrainerAuthRepository extends BaseRepository<ITrainer> implements ITrainerAuthRepository {
    private readonly TrainerModel = Trainer;

    constructor() { super(Trainer); }

    async findByEmail(email: string): Promise<ITrainer | null> {
        return await this.TrainerModel.findOne({ email });
    }

    async createNewData(trainerData: Partial<ITrainer>): Promise<ITrainer> {
        const trainer = new this.TrainerModel(trainerData);
        return await trainer.save();
    }

    async updateOneById(id: string, data: Partial<ITrainer>): Promise<ITrainer | null> {
        return await this.TrainerModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    }

    async update(id: string, data: Partial<ITrainer>): Promise<ITrainer | null> {
        return await this.TrainerModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    }

    async findById(id: string): Promise<ITrainer | null> {
        return await this.TrainerModel.findById(id);
    }
}