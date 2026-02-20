import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  recipientModel: 'user' | 'trainer' | 'admin';
  message: string;
  type: string;
  isRead: boolean;
  relatedId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'recipientModel' },
  recipientModel: { type: String, required: true, enum: ['user', 'trainer', 'admin'] },
  message: { type: String, required: true },
  type: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
export default NotificationModel;
