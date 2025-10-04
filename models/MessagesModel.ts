import { text } from "express";
import mongoose,{Schema, Document} from "mongoose";
import { IMessage } from "../types/message.types";

export interface IMessageModel extends IMessage, Document {}

const MessageSchema: Schema = new Schema<IMessage>(
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trainer",
        required: true,
      },
      text: {
        type: String,
      },
      imageUrl: {
        type: String,
      },
    },
    {
      timestamps: true, 
    }
  );
  
const Message = mongoose.model<IMessage>("Message", MessageSchema)

export default Message
