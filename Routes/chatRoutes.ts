import express from 'express'
import { container } from '../config/container';
import { ChatController } from '../controller/chat/ChatController';
import { checkRole } from '../middleware/roleMiddleware';
import { blockCheckMiddleware } from '../middleware/blockMiddleware';
import { combinedProtect } from '../middleware/authProtect';
import multer from 'multer';
const router = express.Router();
const upload = multer()


const chatController = container.get<ChatController>('ChatController')


//Chat Routes
router.get("/fetchUsers",combinedProtect,checkRole(['trainer']),blockCheckMiddleware, chatController.getAllusers);
router.get("/getMessages/:id",combinedProtect,checkRole(['user','trainer']),blockCheckMiddleware, chatController.getMessages);
router.post("/sendMessages/:id",combinedProtect,upload.single('image'),checkRole(['user','trainer']),blockCheckMiddleware, chatController.sendMessage);

export default router;