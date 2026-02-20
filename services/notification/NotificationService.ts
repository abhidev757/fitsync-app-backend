import { inject, injectable } from "inversify";
import { INotificationService } from "../../interfaces/notification/services/INotificationService";
import { INotificationRepository } from "../../interfaces/notification/repositories/INotificationRepository";
import { INotification } from "../../models/NotificationModel";
import { io, userSocketMap, trainerSocketMap, adminSocketMap } from "../../config/socket";

@injectable()
export class NotificationService implements INotificationService {
  constructor(
    @inject("INotificationRepository") private readonly notificationRepository: INotificationRepository
  ) {}

  async createNotification(data: Partial<INotification>): Promise<INotification> {
    const notification = await this.notificationRepository.createNotification(data);
    
    // Emit via Socket.io to the connected recipient
    const recipientStr = data.recipientId?.toString() || "";
    let socketId: string | undefined;

    if (data.recipientModel === "user") {
      socketId = userSocketMap.get(recipientStr);
      if (socketId) io.to(socketId).emit("new-notification", notification);
    } else if (data.recipientModel === "trainer") {
      socketId = trainerSocketMap.get(recipientStr);
      if (socketId) io.to(socketId).emit("new-notification", notification);
    } else if (data.recipientModel === "admin") {
      // Broadcast to all connected admins
      for (const [adminId, sockId] of adminSocketMap.entries()) {
        io.to(sockId).emit("new-notification", notification);
      }
    }

    if (data.recipientModel !== "admin" && !socketId) {
      console.log(`Socket not found for ${data.recipientModel} ${recipientStr}, notification saved. Maps:`, {
        userSocketMap, trainerSocketMap, adminSocketMap
      });
    }

    return notification;
  }

  async getNotificationsByUserId(userId: string, userType?: string): Promise<INotification[]> {
    return await this.notificationRepository.getNotificationsByUserId(userId, userType);
  }

  async markAsRead(notificationId: string): Promise<INotification | null> {
    return await this.notificationRepository.markAsRead(notificationId);
  }
}
