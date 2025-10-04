import { IBooking } from "../../models/bookingModel";
import { IMessage } from "../../types/message.types";
import { IUser } from "../../types/user.types";

export interface IChatService {
getUserById(userId: string): Promise<IBooking[]>
getMessages(myId: string, userToChatId: string): Promise<IMessage[]>
sendMessage(senderId: string, receiverId: string, text: string, image?: Express.Multer.File): Promise<IMessage>
}