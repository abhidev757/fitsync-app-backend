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


  async findById(trainerId: string): Promise<IBooking[] | null> {
    try {
      
      const bookings = await this.BookingModel
        .find({ trainerId })                          
        .populate<{ userId: IBooking }>('userId', '-password'); 

      if (!bookings.length) {
        return null;
      }

    
      const users = bookings
        .map(b => b.userId)
        .filter((user, idx, arr) =>
          arr.findIndex(u => u._id.toString() === user._id.toString()) === idx
        );

      return users;
      } catch (error) {
        console.error("Error finding User by ID:", error);
        throw new Error("Failed to find User");
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