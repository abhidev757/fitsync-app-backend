import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { inject, injectable } from "inversify";
import { IReviewService } from "../../interfaces/user/services/IReviewService";

@injectable()
export class ReviewController {
  constructor(
    @inject("IReviewService") private readonly reviewService: IReviewService
  ) {}

  submitReview = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId, userId, trainerId, rating, review } = req.body;

    if (!bookingId || !userId || !trainerId || !rating || !review) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    try {
      const saved = await this.reviewService.submitReview({
        bookingId,
        userId,
        trainerId,
        rating: Number(rating),
        review,
      });
      res.status(201).json({ message: "Review submitted successfully", review: saved });
    } catch (error: any) {
      const status = error.message?.includes("already submitted") ? 409 : 500;
      res.status(status).json({ message: error.message || "Failed to submit review" });
    }
  });

  getReview = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    try {
      const review = await this.reviewService.getReviewByBookingId(bookingId);
      res.status(200).json(review);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  getReviewsByTrainer = asyncHandler(async (req: Request, res: Response) => {
    const { trainerId } = req.params;
    try {
      const reviews = await this.reviewService.getReviewsByTrainerId(trainerId);
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trainer reviews" });
    }
  });
}

