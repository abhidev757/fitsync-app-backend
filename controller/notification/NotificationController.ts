import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { inject, injectable } from "inversify";
import { INotificationService } from "../../interfaces/notification/services/INotificationService";
import { HttpStatusCode } from "../../enums/HttpStatusCode";

@injectable()
export class NotificationController {
  constructor(
    @inject("INotificationService") private readonly notificationService: INotificationService
  ) {}

  getNotifications = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userType } = req.query;
      const notifications = await this.notificationService.getNotificationsByUserId(id, userType as string);
      res.status(HttpStatusCode.OK).json(notifications);
    } catch (error) {
      console.log("Error fetching notifications", error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch notifications" });
    }
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;
      const notification = await this.notificationService.markAsRead(notificationId);
      if (!notification) {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: "Notification not found" });
        return;
      }
      res.status(HttpStatusCode.OK).json(notification);
    } catch (error) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to mark as read" });
    }
  });

  // Example manually creating a notification (optional admin endpoint)
  createNotification = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { recipientId, recipientModel, message, type, relatedId } = req.body;
      const notification = await this.notificationService.createNotification({
        recipientId,
        recipientModel,
        message,
        type,
        relatedId
      });
      res.status(HttpStatusCode.CREATED).json(notification);
    } catch (error) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to create notification" });
    }
  });
}
