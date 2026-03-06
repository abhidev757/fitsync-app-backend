import { injectable } from "inversify";
import { IChatRepository } from "../../interfaces/chat/IChatRepository";
import Message from "../../models/MessagesModel";
import { Booking, IBooking } from "../../models/bookingModel";
import { IUser } from "../../types/user.types";
import User from "../../models/UserModel"
import { IMessage } from "../../types/message.types";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { UploadedFile } from "../../types/UploadedFile.types";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

@injectable()
export class ChatRepository
  implements IChatRepository
{
  private readonly MessageModel = Message;
  private readonly UserModel = User; 
  private readonly BookingModel = Booking;
  constructor() {
    
  }


  async findById(trainerId: string): Promise<any[]> {
    try {
      const trainerIdStr = trainerId.toString();
      // 1. Find all users who have ever messaged this trainer
      const messages = await this.MessageModel.find({
        $or: [{ senderId: trainerId }, { receiverId: trainerId }],
      }).sort({ createdAt: -1 });

      const userMessageData = new Map<string, { lastMessage: string; lastMessageTime: string }>();

      for (const msg of messages) {
        const otherUserId = msg.senderId.toString() === trainerIdStr ? msg.receiverId.toString() : msg.senderId.toString();
        if (!userMessageData.has(otherUserId)) {
          const formattedTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
          userMessageData.set(otherUserId, {
            lastMessage: msg.text || (msg.imageUrl ? "Sent an image" : "Message attached"),
            lastMessageTime: formattedTime,
          });
        }
      }

      // 2. Fallback to including users who booked but haven't chatted yet
      const bookings = await this.BookingModel.find({ trainerId }).populate<{ userId: IUser }>('userId', '-password');
      
      const allUserIds = new Set<string>(userMessageData.keys());
      bookings.forEach(b => {
        if (b.userId && b.userId._id) {
            allUserIds.add(b.userId._id.toString());
        }
      });

      if (allUserIds.size === 0) {
        return [];
      }

      // 3. Fetch user details
      const users = await this.UserModel.find({ _id: { $in: Array.from(allUserIds) } });

      // 4. Merge data
      return users.map(user => {
        const msgData = userMessageData.get(user._id.toString()) || { lastMessage: "", lastMessageTime: "" };
        const userObj = user.toObject();
        return {
          ...userObj,
          lastMessage: msgData.lastMessage,
          lastMessageTime: msgData.lastMessageTime,
        };
      });
      
    } catch (error) {
      console.error("Error finding active chats:", error);
      throw new Error("Failed to find active chats");
    }
  }
    
  async findMessages(myId: string,userToChatId: string): Promise<IMessage[] | null> {
      try {
        return await this.MessageModel.find({
          $or:[
            {senderId:myId,receiverId:userToChatId},
            {senderId:userToChatId,receiverId:myId} 
        ]
        });
      } catch (error) {
        console.error("Error finding User by ID:", error);
        throw new Error("Failed to find User");
      }
    }

    async uploadChatImage(file: Express.Multer.File): Promise<UploadedFile> {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME || "your-default-bucket-name",
          Key: `chat-images/${Date.now().toString()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
    
        try {
          const command = new PutObjectCommand(params);
          await s3.send(command);
    
          const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
          return { fileUrl };
        } catch (error) {
          throw new Error("Failed to upload file to S3");
        }
      }

      async createMessage(senderId:string,receiverId:string,text:string,imageUrl?:string): Promise<IMessage> {
        try {
          const message = new this.MessageModel({
            senderId,
            receiverId, 
            text,
            imageUrl
          });
          return await message.save();
        } catch (error) {
          console.error('Error creating message:', error);
          throw new Error('Failed to create message');
        }
      }

}