import { Request, Response } from "express";
import asyncHandler from 'express-async-handler';
import { inject, injectable } from "inversify";
import { ITrainerProfileService } from "../../interfaces/trainer/services/ITrainerProfileService";
import multer from "multer";

const upload = multer();

@injectable()
export class TrainerProfileController {
    constructor(@inject('ITrainerProfileService') private readonly trainerProfileService: ITrainerProfileService) {}

    getTrainerDetails = asyncHandler(async (req: Request, res: Response) => {
        try {
            const userId = req.params.id;
            const trainerProfile = await this.trainerProfileService.getTrainerProfile(userId);

            if (!trainerProfile) {
                res.status(404).json({ message: "Trainer not found" });
                return;
            }
            res.status(200).json(trainerProfile);
        } catch (error) {
            console.error("Error fetching trainer profile:", error);
            res.status(500).json({ message: "Failed to fetch trainer profile" });
        }
    });

    trainerEditProfile = asyncHandler(async (req: Request, res: Response) => {
        try {
            const userId = req.params.id;
            const { userData } = req.body;

            if (!userId) {
                res.status(400).json({ message: "Trainer ID is required" });
                return;
            }

            const updatedProfile = await this.trainerProfileService.updateTrainerProfile(userId, userData);

            res.status(200).json({
                message: "Profile updated successfully",
                user: updatedProfile
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ message: "Failed to update profile" });
        }
    });

    uploadCertificate = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        try {
            const uploadedFile = await this.trainerProfileService.uploadCertificate(req.file);
            res.status(200).json({ fileUrl: uploadedFile.fileUrl });
        } catch (error) {
            res.status(500).json({ message: "File upload failed" });
        }
    });

    uploadProfile = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        try {
            const uploadedFile = await this.trainerProfileService.uploadProfile(req.file);
            res.status(200).json({ fileUrl: uploadedFile.fileUrl });
        } catch (error) {
            res.status(500).json({ message: "File upload failed" });
        }
    });

    // Upload profile image AND save the URL to the trainer document
    uploadAndSaveProfile = asyncHandler(async (req: any, res: Response) => {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        try {
            const trainerId = req.trainer?._id?.toString();
            if (!trainerId) { res.status(401).json({ message: "Unauthorized" }); return; }
            const result = await this.trainerProfileService.uploadAndSaveProfile(req.file, trainerId);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: "Profile image upload failed" });
        }
    });

    // List all active specializations (for the dropdown)
    getSpecializations = asyncHandler(async (_req: Request, res: Response) => {
        try {
            const specializations = await this.trainerProfileService.getSpecializations();
            res.status(200).json(specializations);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch specializations" });
        }
    });

    // Monthly completed sessions for the last 6 months
    getPerformanceStats = asyncHandler(async (req: any, res: Response) => {
        try {
            const trainerId = req.trainer?._id?.toString();
            if (!trainerId) { res.status(401).json({ message: "Unauthorized" }); return; }
            const stats = await this.trainerProfileService.getPerformanceStats(trainerId);
            res.status(200).json(stats);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch performance stats" });
        }
    });
}