import { IUserFitness } from "../../../types/userInfo.types";
import { IWaterLog } from "../../../models/WaterLog";
import { IFitnessData } from "../../../types/fitness.types";
import { DashboardData } from "../repositories/IFitnessRepository";

export interface IFitnessService {
    saveFitnessInfo(fitnessData: IUserFitness): Promise<IUserFitness | null>;
    getWaterLog(userId: string, date: string): Promise<IWaterLog | null>;
    saveWaterLog(userId: string, date: string, waterGlasses: number): Promise<IWaterLog>;
    fetchAndSaveGoogleFitData(userId: string, accessToken: string): Promise<null>;
    getTodayData(userId: string): Promise<IFitnessData | null>;
    getDashboardData(userId: string, year: number, month: number): Promise<DashboardData>;
}
