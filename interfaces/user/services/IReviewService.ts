import { IReview } from "../../../models/ReviewModel";

export interface IReviewService {
  submitReview(data: {
    bookingId: string;
    userId: string;
    trainerId: string;
    rating: number;
    review: string;
  }): Promise<IReview>;

  getReviewByBookingId(bookingId: string): Promise<IReview | null>;

  getReviewsByTrainerId(trainerId: string): Promise<IReview[]>;
}
