import "reflect-metadata";
import { inject, injectable } from "inversify";
import { IAdminService } from "../../interfaces/admin/IAdminService";
import { IAdmin } from "../../types/admin.types";
import { IAdminRepository } from "../../interfaces/admin/IAdminRepository";
import { IUser } from "../../types/user.types";
import { ITrainer } from "../../types/trainer.types";
import { ISpecialization } from "../../types/specialization.types";
import { INotificationService } from "../../interfaces/notification/services/INotificationService";
import mongoose from "mongoose";

@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject("IAdminRepository") private adminRepository: IAdminRepository,
    @inject("INotificationService") private notificationService: INotificationService
  ) {}

  async authenticateAdmin(
    email: string,
    password: string
  ): Promise<IAdmin | null> {
    const admin = await this.adminRepository.authenticate(email);

    if (admin && (await admin.matchPassword(password))) {
      return admin;
    }
    return null;
  }

  async registerAdmin(email: string, password: string): Promise<void> {
    try {
      await this.adminRepository.create(email, password);
    } catch (err) {
      console.log(err);
      throw new Error("Failed to register admin");
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    try {
      return await this.adminRepository.findAllUsers();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to retrieve users");
    }
  }

  async toggleUserStatus(userId: string,status: boolean): Promise<IUser | null> {
    try {
      return await this.adminRepository.updateUserStatus(userId, status);
    } catch (error) {
      console.log(error);
      throw new Error("Failed to toggle user status");
    }
  }
  async getAllTrainers(): Promise<ITrainer[]> {
    try {
      return await this.adminRepository.findAllTrainers();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to retrieve trainers");
    }
  }

  async toggleTrainerStatus(
    trainerId: string,
    status: boolean
  ): Promise<ITrainer | null> {
    try {
      return await this.adminRepository.updateTrainerStatus(trainerId, status);
    } catch (error) {
      console.log(error);
      throw new Error("Failed to toggle trainer status");
    }
  }

  async getUserById(userId: string): Promise<IUser> {
    try {
      const user = await this.adminRepository.findById(userId);
      if (!user) {
        throw new Error("user not found");
      }
      return user;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to Fetch user");
    }
  }

  async getTrainerById(userId: string): Promise<ITrainer> {
    try {
      const user = await this.adminRepository.findTrainerById(userId);
      if (!user) {
        throw new Error("trainer not found");
      }
      return user;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to Fetch trainer");
    }
  }
  async addSpecialization(
    name: string,
    description: string
  ): Promise<ISpecialization | null> {
    try {
      const specialization = await this.adminRepository.addSpecialization(
        name,
        description
      );
      return specialization;
    } catch (error) {
      console.error("Error adding specialization:", error);
      throw new Error("Failed to add specialization");
    }
  }
  async getAllSpecializations(): Promise<ISpecialization[]> {
    try {
        const specializations = await this.adminRepository.getAllSpecializations();
        return specializations;
    } catch (error) {
        console.error('Error fetching specializations:', error);
        throw new Error('Failed to fetch specializations');
    }
}

async toggleSpecializationStatus(name: string, isBlock: boolean): Promise<ISpecialization> {
  try {
      const specialization = await this.adminRepository.toggleSpecializationStatus(name, isBlock);
      return specialization;
  } catch (error) {
      console.error('Error toggling specialization status:', error);
      throw new Error('Failed to toggle specialization status');
  }
}

async getAllApplicants(): Promise<ITrainer[]> {
  try {
      const applicants = await this.adminRepository.getAllApplicants();
      return applicants;
  } catch (error) {
      console.error('Error fetching applicants:', error);
      throw new Error('Failed to fetch applicants');
  }
}

async approveTrainer(id: string): Promise<void> {
  try {
    await this.adminRepository.approveTrainer(id);
  } catch (error) {
    console.log(error);
    throw new Error("Failed to approve trainer");
  }
}

async rejectTrainer(id: string,reason:string): Promise<void> {
  try {
    await this.adminRepository.rejectTrainer(id,reason);
  } catch (error) {
    console.log(error);
    throw new Error("Failed to reject trainer");
  }
}



  async getAllPayoutRequests(): Promise<any[]> {
    try {
      return await this.adminRepository.getAllPayoutRequests();
    } catch (error) {
      console.error("Error fetching payout requests:", error);
      throw new Error("Failed to fetch payout requests");
    }
  }

  async approvePayoutRequest(requestId: string): Promise<void> {
    try {
      const request = await this.adminRepository.approvePayoutRequest(requestId);
      
      // Notify trainer
      if (request && request.trainerId) {
        await this.notificationService.createNotification({
          recipientId: new mongoose.Types.ObjectId(request.trainerId.toString()),
          recipientModel: "trainer",
          type: "PAYOUT_APPROVED",
          message: `Your payout request for $${request.amount} has been approved.`,
          relatedId: new mongoose.Types.ObjectId(requestId),
        });
      }
    } catch (error) {
      console.error("Error approving payout request:", error);
      throw new Error("Failed to approve payout request");
    }
  }

  async rejectPayoutRequest(requestId: string): Promise<void> {
    try {
      await this.adminRepository.rejectPayoutRequest(requestId);
    } catch (error) {
      console.error("Error rejecting payout request:", error);
      throw new Error("Failed to reject payout request");
    }
  }

  async getAllUserPayoutRequests(): Promise<any[]> {
    return await this.adminRepository.getAllUserPayoutRequests();
  }

  async approveUserPayoutRequest(requestId: string): Promise<void> {
    const request = await this.adminRepository.approveUserPayoutRequest(requestId);
    
    // Notify user
    if (request && request.userId) {
      await this.notificationService.createNotification({
        recipientId: new mongoose.Types.ObjectId(request.userId.toString()),
        recipientModel: "user",
        type: "PAYOUT_APPROVED",
        message: `Your payout request for $${request.amount} has been approved.`,
        relatedId: new mongoose.Types.ObjectId(requestId),
      });
    }
  }

  async rejectUserPayoutRequest(requestId: string): Promise<void> {
    return await this.adminRepository.rejectUserPayoutRequest(requestId);
  }

  async getDashboardStats() {
    return await this.adminRepository.getDashboardStats();
  }
}
