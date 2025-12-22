import { ITrainer } from "../../../types/trainer.types";

export interface ITrainerAuthRepository {
    findByEmail(email: string): Promise<ITrainer | null>;
    createNewData(trainerData: Partial<ITrainer>): Promise<ITrainer | null>;
    updateOneById(id: string, data: Partial<ITrainer>): Promise<ITrainer | null>;
    update(id: string, data: Partial<ITrainer>): Promise<ITrainer | null>; // Used for password reset
    findById(id: string): Promise<ITrainer | null>; // Auth needs this for token verification
}