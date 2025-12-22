import { Request, Response } from "express";
import asyncHandler from 'express-async-handler';
import { inject, injectable } from "inversify";
import { ITrainerProfileService } from "../../interfaces/trainer/services/ITrainerProfileService";

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
}