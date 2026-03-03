import "reflect-metadata";
import { injectable } from "inversify";
import { IReviewRepository } from "../../interfaces/user/repositories/IReviewRepository";
import { IReview, Review } from "../../models/ReviewModel";

@injectable()
export class ReviewRepository implements IReviewRepository {
  async create(data: {
    bookingId: string;
    userId: string;
    trainerId: string;
    rating: number;
    review: string;
  }): Promise<IReview> {
    try {
      const newReview = new Review(data);
      return await newReview.save();
    } catch (error) {
      console.error("Error creating review:", error);
      throw new Error("Failed to save review");
    }
  }

  async findByBookingId(bookingId: string): Promise<IReview | null> {
    try {
      return await Review.findOne({ bookingId });
    } catch (error) {
      console.error("Error finding review:", error);
      throw new Error("Failed to find review");
    }
  }

  async findByTrainerId(trainerId: string): Promise<IReview[]> {
    try {
      return await Review.find({ trainerId })
        .populate("userId", "name profileImageUrl")
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error finding reviews by trainer:", error);
      throw new Error("Failed to find reviews");
    }
  }
}
