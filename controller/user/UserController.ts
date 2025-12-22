import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { IUserService } from "../../interfaces/user/services/IUserService";
import { HttpStatusCode } from "../../enums/HttpStatusCode";
import { StatusMessage } from "../../enums/StatusMessage";
import { inject, injectable } from "inversify";

interface AuthenticatedRequest extends Request {
  user?: any;
}

@injectable()
export class UserController {
 constructor(@inject("IUserService") private readonly userService: IUserService) {}

  getUserDetails = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const token = req.params.token;
        const userProfile = await this.userService.getUserProfile(token);

        if (!userProfile) {
          res.status(HttpStatusCode.NOT_FOUND).json({ message: "User not found" });
          return;
        }

        res.status(HttpStatusCode.OK).json(userProfile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch user profile" });
      }
    }
  );

  userEditProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { userData, fitnessData } = req.body;

      if (!userId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: "User ID is required" });
        return;
      }

      const updatedProfile = await this.userService.updateUserAndFitness(
        userId,
        userData,
        fitnessData
      );

      res.status(HttpStatusCode.OK).json({
        message: "Profile updated successfully",
        user: updatedProfile.user,
        fitness: updatedProfile.fitness,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to update profile" });
    }
  });

  getAllTrainers = asyncHandler(async (req: Request, res: Response) => {
    try {
      const trainers = await this.userService.getAllTrainers();
      res.status(HttpStatusCode.OK).json(trainers);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  getTrainer = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const trainerProfile = await this.userService.getTrainer(userId);

      if (!trainerProfile) {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: "Trainer not found" });
        return;
      }

      res.status(HttpStatusCode.OK).json(trainerProfile);
    } catch (error) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch trainer" });
    }
  });

  getAllSpecializations = asyncHandler(async (req: Request, res: Response) => {
    try {
      const specializations = await this.userService.getAllSpecializations();
      res.status(HttpStatusCode.OK).json(specializations);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
    }
  });

  uploadProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.file) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: "No file uploaded" });
        return;
      }
      const userId = req.params.userId;
      if (!userId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: "User ID is required" });
        return;
      }

      try {
        const uploadedFile = await this.userService.uploadProfile(
          req.file,
          userId
        );
        res
          .status(HttpStatusCode.OK)
          .json({ success: true, avatarUrl: uploadedFile.fileUrl });
      } catch (error) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "File upload failed" });
      }
    }
  );
}