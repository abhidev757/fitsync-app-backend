import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { inject, injectable } from "inversify";
import { IFitnessService } from "../../interfaces/user/services/IFitnessService";
import { IUserFitness } from "../../types/userInfo.types";
import { GoogleAuthService } from "../../services/user/GoogleAuthService";

interface AuthenticatedRequest extends Request {
  user?: any;
}

@injectable()
export class FitnessController {
  constructor(@inject("IFitnessService") private readonly fitnessService: IFitnessService) {}

  saveUserFitnessInfo = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId, sex, age, height, weight, targetWeight, activity } = req.body;
      if (!userId) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      const fitnessData: IUserFitness = {
        userId, sex, age, height, weight, targetWeight, activity,
      };
      await this.fitnessService.saveFitnessInfo(fitnessData);

      res.status(201).json({ message: "Fitness data saved successfully" });
    } catch (error) {
      console.error("Error saving fitness data:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  getWater = asyncHandler(async (req: Request, res: Response) => {
    const { userId, date } = req.query as { userId: string; date: string };
    if (!userId || !date) {
      res.status(400).json({ message: "userId and date are required" });
      return;
    }

    try {
      const log = await this.fitnessService.getWaterLog(userId, date);
      res.json({ waterGlasses: log?.waterGlasses || 0 });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get water data" });
    }
  });

  updateWater = asyncHandler(async (req: Request, res: Response) => {
    const { userId, date, waterGlasses } = req.body;
    if (!userId || !date || waterGlasses === undefined) {
      res.status(400).json({ message: "userId, date, and waterGlasses are required" });
      return;
    }

    try {
      const log = await this.fitnessService.saveWaterLog(userId, date, waterGlasses);
      res.json({ message: "Water data updated", data: log });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update water data" });
    }
  });

  getTodayHealthData = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query;
    if (!userId) {
      res.status(400).json({ message: "userId required" });
      return;
    }

    try {
      const data = await this.fitnessService.getTodayData(userId as string);
      res.status(200).json(data);
    } catch (err) {
      console.error("Error fetching health data:", err);
      res.status(500).json({ message: "Failed to fetch data" });
    }
  });

  // Google Fit Specifics
  googleAuthCode = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { code, redirectUri } = req.body;
    const googleAuthService = new GoogleAuthService();
    if (!code || !redirectUri) {
      res.status(400).json({ message: "code and redirectUri required" });
      return;
    }

    await googleAuthService.exchangeCodeAndSaveFitTokens(code, req.user._id, redirectUri);
    res.json({ message: "Google Fit connected" });
  });

  syncGoogleFit = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;
    const googleAuthService = new GoogleAuthService();
    try {
      const updatedRecord = await googleAuthService.fetchAndSaveGoogleFitData(userId);
      res.status(200).json({ message: "Google Fit data synced", data: updatedRecord });
    } catch (err) {
      console.error("Error syncing Google Fit data:", err);
      res.status(500).json({ message: "Failed to sync Google Fit data" });
    }
  });
}