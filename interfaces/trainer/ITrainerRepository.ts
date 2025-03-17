import { ITrainer, IBlockedTrainerResponse,IUnblockedTrainerResponse } from "../../types/trainer.types";

export interface ITrainerRepository {
createNewData(trainerData: Partial<ITrainer>): Promise<ITrainer | null>
updateOneById(id: string, data: Partial<ITrainer>): Promise<ITrainer | null>;
findByEmail(email: string): Promise<ITrainer | null>;
register(userData: Partial<ITrainer>): Promise<ITrainer | null>;
findById(id: string): Promise<ITrainer | null>;
update(id: string, data: Partial<ITrainer>): Promise<ITrainer | null>;
}