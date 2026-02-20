import { injectable } from "inversify";
import NotificationModel, { INotification } from "../../models/NotificationModel";
import { INotificationRepository } from "../../interfaces/notification/repositories/INotificationRepository";

@injectable()
export class NotificationRepository implements INotificationRepository {
  async createNotification(data: Partial<INotification>): Promise<INotification> {
    const notification = new NotificationModel(data);
    return await notification.save();
  }

  async getNotificationsByUserId(userId: string, userType?: string): Promise<INotification[]> {
    if (userType === 'admin') {
      return await NotificationModel.find({ recipientModel: 'admin' }).sort({ createdAt: -1 }).limit(50);
    }
    return await NotificationModel.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(50);
  }

  async markAsRead(notificationId: string): Promise<INotification | null> {
    return await NotificationModel.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
  }
}
