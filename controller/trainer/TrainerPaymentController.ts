import { Request, Response } from "express";
import asyncHandler from 'express-async-handler';
import { inject, injectable } from "inversify";
import { ITrainerPaymentService } from "../../interfaces/trainer/services/ITrainerPaymentService";

@injectable()
export class TrainerPaymentController {
    constructor(@inject('ITrainerPaymentService') private readonly trainerPaymentService: ITrainerPaymentService) {}

    getWalletDetails = asyncHandler(async (req: Request, res: Response) => {
        const trainerId = req.params.id;
        if (!trainerId) {
            res.status(401);
            throw new Error('Unauthorized');
        }

        const walletData = await this.trainerPaymentService.getWalletDetails(trainerId);
        res.json(walletData);
    });

    requestPayout = asyncHandler(async (req: Request, res: Response) => {
        const { trainerId, amount } = req.body;
        if (!trainerId || !amount) {
            res.status(400);
            throw new Error('Trainer ID and Amount are required');
        }

        await this.trainerPaymentService.requestPayout(trainerId, amount);
        res.status(200).json({ message: 'Payout requested successfully' });
    });
}