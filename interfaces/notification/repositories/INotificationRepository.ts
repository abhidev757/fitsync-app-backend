import { INotification } from "../../../models/NotificationModel";

export interface INotificationRepository {
  createNotification(data: Partial<INotification>): Promise<INotification>;
  getNotificationsByUserId(userId: string, userType?: string): Promise<INotification[]>;
  markAsRead(notificationId: string): Promise<INotification | null>;
}
