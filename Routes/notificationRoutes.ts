import express from "express";
import { container } from "../config/container";
import { NotificationController } from "../controller/notification/NotificationController";

const notificationRoutes = express.Router();
const notificationController = container.get<NotificationController>(NotificationController);

// Get notifications for a specific user/trainer/admin
notificationRoutes.get("/:id", notificationController.getNotifications);

// Mark a notification as read
notificationRoutes.put("/read/:notificationId", notificationController.markAsRead);

export default notificationRoutes;
