import { Document,Types } from "mongoose";


export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  text: string;
  imageUrl?: string;
}

export interface IMessageData {
  senderId: string;
  receiverId: string;
  message: string;
  image?: string;
  isRead?: boolean;
  callHistoryId?:string;
}