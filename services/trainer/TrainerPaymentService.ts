import { inject, injectable } from "inversify";
import { ITrainerPaymentRepository } from "../../interfaces/trainer/repositories/ITrainerPaymentRepository";
import { WalletDetails } from "../../types/trainer.types";

@injectable()
export class TrainerPaymentService {
  constructor(
  @inject("ITrainerPaymentRepository") private trainerPaymentRepository: ITrainerPaymentRepository
) {}

  async getWalletDetails(trainerId: string): Promise<WalletDetails> {
    const [balance, transactions] = await Promise.all([
      this.trainerPaymentRepository.getTrainerBalance(trainerId),
      this.trainerPaymentRepository.getWalletTransactions(trainerId),
    ]);

    return {
      balance,
      transactions,
    };
  }
}