import "reflect-metadata";
import { injectable } from "inversify";
import { IAdminRepository, AdminDashboardStats } from "../../interfaces/admin/IAdminRepository";
import { IAdmin } from "../../types/admin.types";
import Admin from "../../models/AdminModel";
import User from "../../models/UserModel";
import { BaseRepository } from "../base/BaseRepository";
import { IUser } from "../../types/user.types";
import { ITrainer } from "../../types/trainer.types";
import Trainer from "../../models/TrainerModel";
import Specialization from "../../models/SpecializationModel";
import { ISpecialization } from "../../types/specialization.types";
import { log } from "console";
import PayoutRequest from "../../models/PayoutRequestModel";
import WalletTransaction from "../../models/WalletModel";
import { PaymentModel } from "../../models/PaymentModel";

@injectable()
export class AdminRepository
  extends BaseRepository<IAdmin>
  implements IAdminRepository
{
  private readonly adminModel = Admin;
  private readonly userModel = User;
  private readonly trainerModel = Trainer;
  private readonly specialization = Specialization;
  private readonly payoutRequestModel = PayoutRequest;
  private readonly walletTransactionModel = WalletTransaction;
  constructor() {
    super(Admin);
  }
  async authenticate(email: string): Promise<IAdmin | null> {
    try {
      return await this.adminModel.findOne({ email });
    } catch (err) {
      console.error("Error during admin authentication:", err);
      throw new Error("Error authenticating admin");
    }
  }

  async create(email: string, password: string): Promise<void> {
    const admin = new this.adminModel({ email, password });
    try {
      await admin.save();
    } catch (err) {
      console.error("Error creating admin", err);
      throw new Error("Error creating admin");
    }
  }

  async findAllUsers(): Promise<IUser[]> {
    try {
      return await this.userModel.find().select("name email status createdAt");
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Error fetching users");
    }
  }

  async updateUserStatus(userId: string,newStatus: boolean): Promise<IUser | null> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, { isBlocked: newStatus }, { new: true })
        .select("_id name isBlocked");
      if (!updatedUser) {
        throw new Error("User not found");
      }
      return updatedUser;
    } catch (error) {
      console.error("Error updating user status:", error);
      throw new Error("Error updating user status");
    }
  }
  async findAllTrainers(): Promise<ITrainer[]> {
    try {
      return await this.trainerModel
        .find()
        .select("name status specializations isBlocked verificationStatus createdAt");
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Error fetching users");
    }
  }

  async updateTrainerStatus(
    trainerId: string,
    newStatus: boolean
  ): Promise<ITrainer | null> {
    try {
      const updatedTrainer = await this.trainerModel
        .findByIdAndUpdate(trainerId, { isBlocked: newStatus }, { new: true })
        .select("_id name isBlocked");
      if (!updatedTrainer) {
        throw new Error("User not found");
      }
      return updatedTrainer;
    } catch (error) {
      console.error("Error updating trainer status:", error);
      throw new Error("Error updating trainer status");
    }
  }

  async findById(userId: string): Promise<IUser | null> {
    try {
      return await this.userModel.findById(userId);
    } catch (error) {
      console.error("Error finding User by ID:", error);
      throw new Error("Failed to find User");
    }
  }
  async findTrainerById(userId: string): Promise<ITrainer | null> {
    try {
      return await this.trainerModel.findById(userId);
    } catch (error) {
      console.error("Error finding trainer by ID:", error);
      throw new Error("Failed to find trainer");
    }
  }
  async addSpecialization(name: string, description: string): Promise<ISpecialization> {
    try {
        const Specialization = await this.specialization.findOneAndUpdate(
            { name }, 
            { name, description }, 
            { upsert: true, new: true, runValidators: true }
        );

        if (!Specialization) {
            throw new Error('Failed to add or update specialization');
        }
 
        return Specialization;
    } catch (error) {
        console.error('Error adding specialization:', error);
        throw new Error('Failed to add specialization');
    }
  }

  async getAllSpecializations(): Promise<ISpecialization[]> {
    try {
        const Specializations = await this.specialization.find();
        return Specializations;
    } catch (error) {
        console.error('Error fetching specializations:', error);
        throw new Error('Failed to fetch specializations');
    }
}

async toggleSpecializationStatus(name: string, isBlock: boolean): Promise<ISpecialization> {
        try {
          console.log(`Toggling status for name: ${name}, isBlock: ${isBlock}`);
            const specialization = await Specialization.findOneAndUpdate(
                {name},
                { isBlock },
                { new: true, runValidators: true }
            );

            if (!specialization) {
                throw new Error('Specialization not found');
            }

            return specialization;
        } catch (error) {
            console.error('Error toggling specialization status:', error);
            throw new Error('Failed to toggle specialization status');
        }
    }

    async getAllApplicants(): Promise<ITrainer[]> {
      try {
          const applicants = await this.trainerModel.find({verificationStatus:false});
          console.log("Applicants:",applicants);
          
          return applicants;
      } catch (error) {
          console.error('Error fetching specializations:', error);
          throw new Error('Failed to fetch specializations');
      }
  }

  async approveTrainer(id: string): Promise<void> {
    try {
      await this.trainerModel.findByIdAndUpdate(
        id,
        { verificationStatus: true },
        { new: true }
      );
    } catch (error) {
      console.error("Error approving trainer:", error);
      throw new Error("Failed to approve trainer");
    }
  }

  async rejectTrainer(id: string,reason:string): Promise<void> {
    try {
      await this.trainerModel.findByIdAndUpdate(
        id,
        { rejectReason: reason },
        { new: true }
      );
    } catch (error) {
      console.error("Error rejecting trainer:", error);
      throw new Error("Failed to reject trainer");
    }
  }
  


  async getAllPayoutRequests(): Promise<any[]> {
    try {
      return await this.payoutRequestModel.find().populate('trainerId', 'name email').sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching payout requests:", error);
      throw new Error("Failed to fetch payout requests");
    }
  }

  async approvePayoutRequest(requestId: string): Promise<any> {
    try {
      const request = await this.payoutRequestModel.findById(requestId);
      if (!request || request.status !== 'pending') {
        throw new Error("Invalid request or already processed");
      }

      // Balance was already debited at request time.
      // Just update the pending wallet transaction → debit.
      await this.walletTransactionModel.findOneAndUpdate(
        { trainerId: request.trainerId, type: 'pending', amount: request.amount },
        { type: 'debit', reason: 'Payout approved' }
      );

      request.status = 'approved';
      await request.save();
      return request;
    } catch (error) {
      console.error("Error approving payout request:", error);
      throw error;
    }
  }

  async rejectPayoutRequest(requestId: string): Promise<void> {
    try {
      const request = await this.payoutRequestModel.findById(requestId);
      if (!request || request.status !== 'pending') {
        throw new Error("Invalid request or already processed");
      }

      // Restore the debited balance back to the trainer
      await this.trainerModel.findByIdAndUpdate(request.trainerId, { $inc: { balance: request.amount } });

      // Update the pending transaction to reflect the refund
      await this.walletTransactionModel.findOneAndUpdate(
        { trainerId: request.trainerId, type: 'pending', amount: request.amount },
        { type: 'credit', reason: 'Payout rejected – amount refunded' }
      );

      request.status = 'rejected';
      await request.save();
    } catch (error) {
      console.error("Error rejecting payout request:", error);
      throw new Error("Failed to reject payout request");
    }
  }

  private readonly userPayoutRequestModel = require("../../models/UserPayoutRequestModel").default;
  private readonly userWalletTransactionModel = require("../../models/UserWallet").default;

  async getAllUserPayoutRequests(): Promise<any[]> {
    try {
      return await this.userPayoutRequestModel.find().populate('userId', 'name email').sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching user payout requests:", error);
      throw new Error("Failed to fetch user payout requests");
    }
  }

  async approveUserPayoutRequest(requestId: string): Promise<any> {
    try {
      const request = await this.userPayoutRequestModel.findById(requestId);
      if (!request || request.status !== 'pending') {
        throw new Error("Invalid request or already processed");
      }

      // Balance was already debited at request time.
      // Just update the pending wallet transaction → debit.
      await this.userWalletTransactionModel.findOneAndUpdate(
        { userId: request.userId, type: 'pending', amount: request.amount },
        { type: 'debit', reason: 'Payout approved' }
      );

      request.status = 'approved';
      await request.save();
      return request;
    } catch (error) {
      console.error("Error approving user payout:", error);
      throw error;
    }
  }

  async rejectUserPayoutRequest(requestId: string): Promise<void> {
    try {
      const request = await this.userPayoutRequestModel.findById(requestId);
      if (!request || request.status !== 'pending') {
        throw new Error("Invalid request or already processed");
      }

      // Restore the debited balance back to the user
      await this.userModel.findByIdAndUpdate(request.userId, { $inc: { balance: request.amount } });

      // Update the pending transaction to reflect the refund
      await this.userWalletTransactionModel.findOneAndUpdate(
        { userId: request.userId, type: 'pending', amount: request.amount },
        { type: 'credit', reason: 'Payout rejected – amount refunded' }
      );

      await this.userPayoutRequestModel.findByIdAndUpdate(requestId, { status: 'rejected' });
    } catch (error) {
      console.error("Error rejecting user payout:", error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const [totalUsers, totalTrainers, revenueAgg, userGrowthAgg, revenueGrowthAgg] = await Promise.all([
      this.userModel.countDocuments(),
      this.trainerModel.countDocuments({ verificationStatus: true }),

      // Total revenue
      PaymentModel.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),

      // Monthly user sign-ups (current year)
      this.userModel.aggregate([
        { $match: { createdAt: { $gte: startOfYear, $lt: endOfYear } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      ]),

      // Monthly revenue (current year)
      PaymentModel.aggregate([
        { $match: { createdAt: { $gte: startOfYear, $lt: endOfYear }, status: "success" } },
        { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$amount" } } },
      ]),
    ]);

    // Build 12-slot arrays
    const userGrowth = Array(12).fill(0);
    for (const item of userGrowthAgg) {
      userGrowth[(item._id as number) - 1] = item.count;
    }

    const revenueGrowth = Array(12).fill(0);
    for (const item of revenueGrowthAgg) {
      revenueGrowth[(item._id as number) - 1] = item.total;
    }

    return {
      totalUsers,
      totalTrainers,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      userGrowth,
      revenueGrowth,
    };
  }
}


