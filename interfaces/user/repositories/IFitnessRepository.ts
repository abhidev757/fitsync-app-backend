import { IUserFitness } from "../../../types/userInfo.types";
import { IWaterLog } from "../../../models/WaterLog";
import { IFitnessData } from "../../../types/fitness.types";

export interface IFitnessRepository {
    saveFitnessInfo(fitnessData: IUserFitness): Promise<IUserFitness | null>;
    getFitnessInfo(userId: string): Promise<IUserFitness | null>;
    updateFitnessInfo(userId: string, fitnessData: Partial<IUserFitness>): Promise<IUserFitness | null>;
    findWaterLog(userId: string, date: string): Promise<IWaterLog | null>;
    upsertWaterLog(userId: string, date: string, waterGlasses: number): Promise<IWaterLog>;
    saveOrUpdate(userId: string, date: string, data: { steps: number; calories: number; sleepMinutes: number }): Promise<null>;
    getByDate(userId: string, date: string): Promise<IFitnessData | null>;
}