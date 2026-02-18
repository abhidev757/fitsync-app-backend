import "reflect-metadata";
import { injectable } from "inversify";
import { IAdminRepository } from "../../interfaces/admin/IAdminRepository";
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
        .select("name status specializations createdAt");
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

  async approvePayoutRequest(requestId: string): Promise<void> {
    try {
      const request = await this.payoutRequestModel.findById(requestId);
      if (!request || request.status !== 'pending') {
        throw new Error("Invalid request or already processed");
      }

      const trainer = await this.trainerModel.findById(request.trainerId);
      if (!trainer) {
        throw new Error("Trainer not found");
      }

      if (trainer.balance < request.amount) {
        throw new Error("Insufficient balance");
      }

      trainer.balance -= request.amount;
      await trainer.save();

      request.status = 'approved';
      await request.save();

      await this.walletTransactionModel.create({
        trainerId: trainer._id,
        amount: request.amount,
        type: 'debit',
        reason: 'Payout approved',
        createdAt: new Date()
      });

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
      request.status = 'rejected';
      await request.save();
    } catch (error) {
      console.error("Error rejecting payout request:", error);
      throw new Error("Failed to reject payout request");
    }
  }

}
