import { inject, injectable } from "inversify";
import { IFitnessRepository, DashboardData } from "../../interfaces/user/repositories/IFitnessRepository";
import { IUserFitness } from "../../types/userInfo.types";
import { IWaterLog } from "../../models/WaterLog";
import { IFitnessData } from "../../types/fitness.types";
import { google, fitness_v1 } from "googleapis";
import { GaxiosResponse } from "gaxios";

@injectable()
export class FitnessService {
  constructor(
    @inject("IFitnessRepository") private fitnessRepository: IFitnessRepository
  ) {}

  async saveFitnessInfo(fitnessData: IUserFitness): Promise<IUserFitness | null> {
    try {
      return await this.fitnessRepository.saveFitnessInfo(fitnessData);
    } catch (error) {
      console.error("Error saving user fitness info:", error);
      throw new Error("Failed to save fitness info");
    }
  }

  async getFitnessInfo(userId: string): Promise<IUserFitness> {
    try {
      const fitnessInfo = await this.fitnessRepository.getFitnessInfo(userId);
      if (!fitnessInfo) throw new Error("Fitness info not found");
      return fitnessInfo;
    } catch (error) {
      console.error("Error retrieving user fitness info:", error);
      throw new Error("Failed to retrieve fitness info");
    }
  }

  async getWaterLog(userId: string, date: string): Promise<IWaterLog | null> {
    return await this.fitnessRepository.findWaterLog(userId, date);
  }

  async saveWaterLog(userId: string, date: string, waterGlasses: number): Promise<IWaterLog> {
    return await this.fitnessRepository.upsertWaterLog(userId, date, waterGlasses);
  }

  async fetchAndSaveGoogleFitData(userId: string, accessToken: string): Promise<null> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const fitness = google.fitness({ version: "v1", auth: oauth2Client });
    const now = Date.now();
    const start = now - 24 * 60 * 60 * 1000;

    const params: fitness_v1.Params$Resource$Users$Dataset$Aggregate = {
      userId: "me",
      requestBody: {
        aggregateBy: [
          { dataTypeName: "com.google.step_count.delta" },
          { dataTypeName: "com.google.calories.expended" },
          { dataTypeName: "com.google.sleep.segment" },
        ],
        bucketByTime: { durationMillis: `${86_400_000}` },
        startTimeMillis: `${start}`,
        endTimeMillis: `${now}`,
      },
    };

    const response: GaxiosResponse<fitness_v1.Schema$AggregateResponse> = await fitness.users.dataset.aggregate(params);
    const buckets = response.data.bucket ?? [];

    let steps = 0, calories = 0, sleepMinutes = 0;
    for (const bucket of buckets) {
      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          switch (point.dataTypeName) {
            case "com.google.step_count.delta":
              steps += point.value?.[0]?.intVal || 0;
              break;
            case "com.google.calories.expended":
              calories += point.value?.[0]?.fpVal || 0;
              break;
            case "com.google.sleep.segment":
              sleepMinutes += (Number(point.endTimeNanos) - Number(point.startTimeNanos)) / 1e9 / 60;
              break;
          }
        }
      }
    }

    const date = new Date().toISOString().slice(0, 10);
    return this.fitnessRepository.saveOrUpdate(userId, date, { steps, calories, sleepMinutes });
  }

  async getTodayData(userId: string): Promise<IFitnessData | null> {
    const today = new Date().toISOString().slice(0, 10);
    return this.fitnessRepository.getByDate(userId, today);
  }

  async getDashboardData(userId: string, year: number, month: number): Promise<DashboardData> {
    return this.fitnessRepository.getDashboardData(userId, year, month);
  }
}
