import { inject, injectable } from "inversify";
import { IReviewService } from "../../interfaces/user/services/IReviewService";
import { IReviewRepository } from "../../interfaces/user/repositories/IReviewRepository";
import { IReview } from "../../models/ReviewModel";

@injectable()
export class ReviewService implements IReviewService {
  constructor(
    @inject("IReviewRepository")
    private reviewRepository: IReviewRepository
  ) {}

  async submitReview(data: {
    bookingId: string;
    userId: string;
    trainerId: string;
    rating: number;
    review: string;
  }): Promise<IReview> {
    const existing = await this.reviewRepository.findByBookingId(data.bookingId);
    if (existing) throw new Error("You have already submitted a review for this session.");
    return this.reviewRepository.create(data);
  }

  async getReviewByBookingId(bookingId: string): Promise<IReview | null> {
    return this.reviewRepository.findByBookingId(bookingId);
  }

  async getReviewsByTrainerId(trainerId: string): Promise<IReview[]> {
    return this.reviewRepository.findByTrainerId(trainerId);
  }
}
