import { Container } from "inversify";
import 'reflect-metadata';

// ================= ADMIN =================
import { IAdminService } from "../interfaces/admin/IAdminService";
import { AdminController } from "../controller/admin/AdminController";
import { AdminService } from "../services/admin/AdminService";
import { IAdminRepository } from "../interfaces/admin/IAdminRepository";
import { AdminRepository } from "../repositories/admin/AdminRepository";

// ================= TRAINER =================
// --- Trainer Repository Interfaces ---
import { ITrainerAuthRepository } from "../interfaces/trainer/repositories/ITrainerAuthRepository";
import { ITrainerProfileRepository } from "../interfaces/trainer/repositories/ITrainerProfileRepository";
import { ITrainerBookingRepository } from "../interfaces/trainer/repositories/ITrainerBookingRepository";
import { ITrainerScheduleRepository } from "../interfaces/trainer/repositories/ITrainerScheduleRepository";
import { ITrainerPaymentRepository } from "../interfaces/trainer/repositories/ITrainerPaymentRepository";

// --- Trainer Repository Implementations ---
import { TrainerAuthRepository } from "../repositories/trainer/TrainerAuthRepository";
import { TrainerProfileRepository } from "../repositories/trainer/TrainerProfileRepository";
import { TrainerBookingRepository } from "../repositories/trainer/TrainerBookingRepository";
import { TrainerScheduleRepository } from "../repositories/trainer/TrainerScheduleRepository";
import { TrainerPaymentRepository } from "../repositories/trainer/TrainerPaymentRepository";

// --- 1. Trainer Service Interfaces (New) ---
import { ITrainerAuthService } from "../interfaces/trainer/services/ITrainerAuthService";
import { ITrainerProfileService } from "../interfaces/trainer/services/ITrainerProfileService";
import { ITrainerBookingService } from "../interfaces/trainer/services/ITrainerBookingService";
import { ITrainerScheduleService } from "../interfaces/trainer/services/ITrainerScheduleService";
import { ITrainerPaymentService } from "../interfaces/trainer/services/ITrainerPaymentService";

// --- 2. Trainer Service Implementations (New) ---
import { TrainerAuthService } from "../services/trainer/TrainerAuthService";
import { TrainerProfileService } from "../services/trainer/TrainerProfileService";
import { TrainerBookingService } from "../services/trainer/TrainerBookingService";
import { TrainerScheduleService } from "../services/trainer/TrainerScheduleService";
import { TrainerPaymentService } from "../services/trainer/TrainerPaymentService";

// --- 3. Trainer Controllers ---
import { TrainerAuthController } from "../controller/trainer/TrainerAuthController";
import { TrainerProfileController } from "../controller/trainer/TrainerProfileController";
import { TrainerBookingController } from "../controller/trainer/TrainerBookingController";
import { TrainerScheduleController } from "../controller/trainer/TrainerScheduleController";
import { TrainerPaymentController } from "../controller/trainer/TrainerPaymentController";

// ================= CHAT =================
import { IChatRepository } from "../interfaces/chat/IChatRepository";
import { IChatService } from "../interfaces/chat/IChatService";
import { ChatService } from "../services/chat/ChatService";
import { ChatController } from "../controller/chat/ChatController";
import { ChatRepository } from "../repositories/chat/ChatRepository";

// ================= USER =================

// --- User Repository Interfaces ---
import { IUserRepository } from "../interfaces/user/repositories/IUserRepository";
import { IAuthRepository } from "../interfaces/user/repositories/IAuthRepository";
import { IBookingRepository } from "../interfaces/user/repositories/IBookingRepository";
import { IPaymentRepository } from "../interfaces/user/repositories/IPaymentRepository";
import { IFitnessRepository } from "../interfaces/user/repositories/IFitnessRepository";

// --- User Repository Implementations ---
import { UserRepository } from "../repositories/user/UserRepository";
import { AuthRepository } from "../repositories/user/AuthRepository";
import { BookingRepository } from "../repositories/user/BookingRepository";
import { PaymentRepository } from "../repositories/user/PaymentRepository";
import { FitnessRepository } from "../repositories/user/FitnessRepository";

// --- User Service Interfaces ---
import { IUserService } from "../interfaces/user/services/IUserService";
import { IAuthService } from "../interfaces/user/services/IAuthService";
import { IBookingService } from "../interfaces/user/services/IBookingService";
import { IPaymentService } from "../interfaces/user/services/IPaymentService";
import { IFitnessService } from "../interfaces/user/services/IFitnessService";

// --- User Service Implementations ---
import { UserService } from "../services/user/UserService";
import { AuthService } from "../services/user/AuthService";
import { BookingService } from "../services/user/BookingService";
import { PaymentService } from "../services/user/PaymentService";
import { FitnessService } from "../services/user/FitnessService";

// --- User Controllers ---
import { UserController } from "../controller/user/UserController";
import { AuthController } from "../controller/user/AuthController";
import { BookingController } from "../controller/user/BookingController";
import { PaymentController } from "../controller/user/PaymentController";
import { FitnessController } from "../controller/user/FitnessController";

// Config
import { STRIPE_CONFIG } from "./stripe";

const container = new Container();

// ---------------------------------------------------------
//                      BINDINGS
// ---------------------------------------------------------

// --- Admin ---
container.bind<IAdminRepository>('IAdminRepository').toDynamicValue(() => new AdminRepository());
container.bind<IAdminService>('IAdminService').to(AdminService).inSingletonScope();
container.bind<AdminController>('AdminController').to(AdminController).inSingletonScope();

// --- Trainer Repositories ---
container.bind<ITrainerAuthRepository>('ITrainerAuthRepository').toDynamicValue(() => new TrainerAuthRepository());
container.bind<ITrainerProfileRepository>('ITrainerProfileRepository').toDynamicValue(() => new TrainerProfileRepository());
container.bind<ITrainerBookingRepository>('ITrainerBookingRepository').toDynamicValue(() => new TrainerBookingRepository());
container.bind<ITrainerScheduleRepository>('ITrainerScheduleRepository').toDynamicValue(() => new TrainerScheduleRepository());
container.bind<ITrainerPaymentRepository>('ITrainerPaymentRepository').toDynamicValue(() => new TrainerPaymentRepository());

// --- Trainer Services (New Split Services) ---
container.bind<ITrainerAuthService>('ITrainerAuthService').to(TrainerAuthService).inSingletonScope();
container.bind<ITrainerProfileService>('ITrainerProfileService').to(TrainerProfileService).inSingletonScope();
container.bind<ITrainerBookingService>('ITrainerBookingService').to(TrainerBookingService).inSingletonScope();
container.bind<ITrainerScheduleService>('ITrainerScheduleService').to(TrainerScheduleService).inSingletonScope();
container.bind<ITrainerPaymentService>('ITrainerPaymentService').to(TrainerPaymentService).inSingletonScope();

// --- Trainer Controllers ---
container.bind<TrainerAuthController>(TrainerAuthController).toSelf();
container.bind<TrainerProfileController>(TrainerProfileController).toSelf();
container.bind<TrainerBookingController>(TrainerBookingController).toSelf();
container.bind<TrainerScheduleController>(TrainerScheduleController).toSelf();
container.bind<TrainerPaymentController>(TrainerPaymentController).toSelf();

// --- Chat ---
container.bind<IChatRepository>('IChatRepository').toDynamicValue(() => new ChatRepository());
container.bind<IChatService>('IChatService').to(ChatService).inSingletonScope();
container.bind<ChatController>('ChatController').to(ChatController).inSingletonScope();

// --- User Repositories ---
container.bind<IUserRepository>('IUserRepository').toDynamicValue(() => new UserRepository());
container.bind<IAuthRepository>('IAuthRepository').toDynamicValue(() => new AuthRepository());
container.bind<IBookingRepository>('IBookingRepository').toDynamicValue(() => new BookingRepository());
container.bind<IPaymentRepository>('IPaymentRepository').toDynamicValue(() => new PaymentRepository());
container.bind<IFitnessRepository>('IFitnessRepository').toDynamicValue(() => new FitnessRepository());

// --- User Services ---
container.bind<IUserService>('IUserService').to(UserService).inSingletonScope();
container.bind<IAuthService>('IAuthService').to(AuthService).inSingletonScope();
container.bind<IBookingService>('IBookingService').to(BookingService).inSingletonScope();
container.bind<IPaymentService>('IPaymentService').to(PaymentService).inSingletonScope();
container.bind<IFitnessService>('IFitnessService').to(FitnessService).inSingletonScope();

// --- User Controllers ---
container.bind<UserController>(UserController).toSelf();
container.bind<AuthController>(AuthController).toSelf();
container.bind<BookingController>(BookingController).toSelf();
container.bind<PaymentController>(PaymentController).toSelf();
container.bind<FitnessController>(FitnessController).toSelf();

// --- Config ---
container.bind<string>("StripeSecretKey").toConstantValue(process.env.STRIPE_SECRET_KEY!);
container.bind<typeof STRIPE_CONFIG>("StripeConfig").toConstantValue(STRIPE_CONFIG);

export { container };