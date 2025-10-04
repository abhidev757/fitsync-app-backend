import { inject, injectable } from "inversify";
import { IChatService } from "../../interfaces/chat/IChatService";
import { HttpStatusCode } from "../../enums/HttpStatusCode";
import asyncHandler from "express-async-handler";
import { StatusMessage } from "../../enums/StatusMessage";
import { Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  user?: any;
  trainer?: any;
  role?: 'user' | 'trainer';
}

@injectable()
export class ChatController {
  constructor(
    @inject("IChatService") private readonly chatService: IChatService
  ) {}

  getAllusers = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const loggedInUserId = req.trainer._id;
        const trainers = await this.chatService.getUserById(loggedInUserId);
        res.status(HttpStatusCode.OK).json(trainers);
      } catch (error) {
        console.error(error);
        res
          .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
          .json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
      }
    }
  );

  getMessages = asyncHandler(
    async(req: AuthenticatedRequest, res:Response) => {
      try {
        const {id:userToChat} = req.params;
        const myId = req.user?._id || req.trainer?._id;
        const messages = await this.chatService.getMessages(myId,userToChat);
        res.status(HttpStatusCode.OK).json(messages)
      } catch (error) {
        console.log(error);
        res
          .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
          .json({message:StatusMessage.INTERNAL_SERVER_ERROR})
      }
    }
  );

  sendMessage = asyncHandler(
    async (req:AuthenticatedRequest, res: Response)=>{
      try {
        const {id: receiverId} = req.params
        const text = req.body.text;       
        const image = req.file;       
        const senderId = req.user?._id || req.trainer?._id;
        console.log("Message sent from frontend:", text);
        

        const newMessage = await this.chatService.sendMessage(senderId,receiverId,text,image);
        res
          .status(HttpStatusCode.CREATED)
          .json({ success: true, data: newMessage });
      } catch (error) {
        console.error(error);
        res
          .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
          .json({ success: false, error: StatusMessage.SEND_MESSAGE_FAILED });
      }
    }
  );


}
