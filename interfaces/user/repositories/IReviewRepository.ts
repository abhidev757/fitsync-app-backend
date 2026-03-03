import { IReview } from "../../../models/ReviewModel";

export interface IReviewRepository {
  create(data: {
    bookingId: string;
    userId: string;
    trainerId: string;
    rating: number;
    review: string;
  }): Promise<IReview>;

  findByBookingId(bookingId: string): Promise<IReview | null>;

  findByTrainerId(trainerId: string): Promise<IReview[]>;
}
