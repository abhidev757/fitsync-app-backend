import { inject, injectable } from "inversify";
import { IChatService } from "../../interfaces/chat/IChatService";
import { IChatRepository } from "../../interfaces/chat/IChatRepository";
import { IUser } from "../../types/user.types";
import { IMessage, IMessageData } from "../../types/message.types";
import { IBooking } from "../../models/bookingModel";

@injectable()
export class ChatService implements IChatService {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository
  ) {}

  async getUserById(userId: string): Promise<IBooking[]> {
    try {
      const user = await this.chatRepository.findById(userId);
      if (!user) {
        throw new Error("users not found");
      }
      return user;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to Fetch users");
    }
  }

  async getMessages(myId: string, userToChatId: string): Promise<IMessage[]> {
    try {
      const messages = await this.chatRepository.findMessages(myId,userToChatId);
      if (!messages) {
        throw new Error("messages not found");
      }
      return messages;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to Fetch messages");
    }
  }
  async sendMessage(senderId: string, receiverId: string, text: string, image?: Express.Multer.File): Promise<IMessage> {
    try {
      const imageUrl = image ? (await this.chatRepository.uploadChatImage(image)).fileUrl : undefined;
  
      const newMessage = await this.chatRepository.createMessage(senderId, receiverId, text, imageUrl);
      return newMessage;
      
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to send message");
    }
  }
  
}
