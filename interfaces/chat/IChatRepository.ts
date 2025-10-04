import { IBooking } from "../../models/bookingModel";
import { IMessage } from "../../types/message.types";
import { UploadedFile } from "../../types/UploadedFile.types";
import { IUser } from "../../types/user.types";


export interface IChatRepository {
findById(trainerId: string): Promise<IBooking[] | null>
findMessages(myId: string,userToChatId: string): Promise<IMessage[] | null>
uploadChatImage(file: Express.Multer.File): Promise<UploadedFile>
createMessage(senderId:string,receiverId:string,text:string,imageUrl?:string): Promise<IMessage>
}