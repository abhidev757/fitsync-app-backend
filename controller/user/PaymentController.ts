import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { inject, injectable } from "inversify";
import { IPaymentService } from "../../interfaces/user/services/IPaymentService";
import { PaymentIntentMetadata } from "../../types/user.types";

@injectable()
export class PaymentController {
 constructor(@inject("IPaymentService") private readonly paymentService: IPaymentService) {}

  createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId, amount, trainerId, sessionTime, startDate, isPackage } = req.body;
      
      const metadata: PaymentIntentMetadata = {
        userId,
        trainerId,
        sessionTime,
        startDate,
        isPackage: isPackage.toString(),
      };

      const paymentIntent = await this.paymentService.createPaymentIntent(
        amount,
        trainerId,
        metadata
      );

      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Payment intent error:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  getWalletDetails = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    const walletData = await this.paymentService.getWalletDetails(userId);
    res.json(walletData);
  });

  requestPayout = asyncHandler(async (req: Request, res: Response) => {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
        res.status(400);
        throw new Error("Missing required fields");
    }
    await this.paymentService.requestPayout(userId, amount);
    res.status(200).json({ message: "Payout request submitted" });
  });
}