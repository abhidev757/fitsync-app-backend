import { WalletDetails } from "../../../types/trainer.types";

export interface ITrainerPaymentService {
    getWalletDetails(trainerId: string): Promise<WalletDetails>;
}