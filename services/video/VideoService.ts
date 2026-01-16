import { injectable, inject } from "inversify";
import { IVideoService } from "../../interfaces/video/IVideoService";
import { IVideoRepository } from "../../interfaces/video/IVideoRepository";

@injectable()
export class VideoService implements IVideoService {
    constructor(
        @inject('IVideoRepository') private _videoRepo: IVideoRepository
    ) {}

    async validateSessionAccess(sessionId: string, userId: string) {
        const session = await this._videoRepo.findBookingById(sessionId);
        if (!session || session.status !== 'live') {
            return { canJoin: false, role: '' };
        }
        
        const isTrainer = session.trainerId.toString() === userId;
        const isUser = session.userId.toString() === userId;

        return {
            canJoin: isTrainer || isUser,
            role: isTrainer ? 'trainer' : 'user'
        };
    }

    // services/video/VideoService.ts
async startSession(sessionId: string, trainerId: string) {
    const session = await this._videoRepo.findBookingById(sessionId);
    
    if (!session) {
        console.log("Service: Session not found for ID:", sessionId);
        return false;
    }

    // Use .toString() on both sides to be 100% sure
    const isMatch = session.trainerId.toString() === trainerId.toString();
    
    console.log("Comparing:", session.trainerId.toString(), "with", trainerId.toString());
    console.log("Match result:", isMatch);

    if (isMatch) {
        return await this._videoRepo.updateStatus(sessionId, 'live');
    }
    
    return false;
    }

    async endSession(sessionId: string) {
        return await this._videoRepo.updateStatus(sessionId, 'ended');
    }
}