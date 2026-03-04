import { IBooking } from "../../../models/bookingModel";

export interface TrainerDashboardStats {
    totalClients: number;
    upcomingCount: number;
    totalSessions: number;
    walletBalance: number;
    upcomingList: { clientName: string; clientAvatar: string | null; date: string; time: string; status: string }[];
    monthlyEarnings: number[];
    monthLabels: string[];
}

export interface ITrainerBookingRepository {
    findByTrainerId(trainerId: string): Promise<IBooking[]>;
    findByBookingId(bookingId: string): Promise<IBooking | null>;
    updateBookingStatus(bookingId: string, status: string): Promise<IBooking>;
    getDashboardStats(trainerId: string): Promise<TrainerDashboardStats>;
}
