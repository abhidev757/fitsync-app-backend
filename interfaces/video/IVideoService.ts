export interface IVideoService {
    validateSessionAccess(sessionId: string, userId: string): Promise<{canJoin: boolean; role: string}>;
    startSession(sessionId: string, trainerId: string): Promise<boolean>;
    endSession(sessionId: string): Promise<boolean>;
}