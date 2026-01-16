import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IVideoService } from "../../interfaces/video/IVideoService";

// Define a proper interface that matches your combinedProtect middleware
interface AuthenticatedRequest extends Request {
    user?: any;
    trainer?: any;
    role?: 'user' | 'trainer';
}

@injectable()
export class VideoController {
    constructor(
        @inject('IVideoService') private _videoService: IVideoService
    ) {}

    async startCall(req: AuthenticatedRequest, res: Response) {
        try {
            const { sessionId } = req.body;
            
            // Extract ID from trainer object (Mongoose uses _id)
            const trainerId = req.trainer?._id?.toString() || req.trainer?.id;
            
            console.log('Trainer Id:', trainerId);

            if (!trainerId) {
                return res.status(401).json({ message: "Trainer authentication failed" });
            }

            const success = await this._videoService.startSession(sessionId, trainerId);
            return res.status(success ? 200 : 400).json({ success });
        } catch (error: any) {
            console.error("Controller Error (startCall):", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async validateAccess(req: AuthenticatedRequest, res: Response) {
        try {
            const { sessionId } = req.params;
            
            // Determine if we should use trainer or user ID based on who is calling
            const actor = req.role === 'trainer' ? req.trainer : req.user;
            const actorId = actor?._id?.toString() || actor?.id;

            if (!actorId) {
                return res.status(401).json({ message: "Authentication failed" });
            }

            const result = await this._videoService.validateSessionAccess(sessionId, actorId);
            return res.status(200).json(result);
        } catch (error: any) {
            console.error("Controller Error (validateAccess):", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
}