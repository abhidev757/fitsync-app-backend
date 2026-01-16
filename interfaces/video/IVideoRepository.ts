export interface IVideoRepository {
    findBookingById(sessionId: string): Promise<any>;
    updateStatus(sessionId: string, status: 'waiting' | 'live' | 'ended'): Promise<boolean>;
}