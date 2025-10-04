import { Container } from "inversify";
import 'reflect-metadata';



//Admin
import { IAdminService } from "../interfaces/admin/IAdminService";
import { AdminController } from "../controller/admin/AdminController";
import { AdminService } from "../services/admin/AdminService";
import { IAdminRepository } from "../interfaces/admin/IAdminRepository";
import {AdminRepository} from "../repositories/admin/AdminRepository"

//Trainer
import { ITrainerService } from "../interfaces/trainer/ITrainerService";
import { ITrainerRepository } from "../interfaces/trainer/ITrainerRepository";
import { TrainerRepository } from "../repositories/trainer/TrainerRepository";
import { TrainerService } from "../services/trainer/TrainerService";
import { TrainerController } from "../controller/trainer/TrainerController";

//User
import { IUserService } from "../interfaces/user/IUserService";
import { IUserRepository } from "../interfaces/user/IUserRepository";
import { UserRepository } from "../repositories/user/UserRepository";
import { UserService } from "../services/user/UserService";
import { UserController } from "../controller/user/UserController";
import { STRIPE_CONFIG } from "./stripe";

//Chat
import { IChatRepository } from "../interfaces/chat/IChatRepository";
import { IChatService } from "../interfaces/chat/IChatService";
import { ChatService } from "../services/chat/ChatService";
import { ChatController } from "../controller/chat/ChatController";
import { ChatRepository } from "../repositories/chat/ChatRepository";




const container = new Container();
//Admin Container
container.bind<IAdminRepository>('IAdminRepository').toDynamicValue(()=>{
    return new AdminRepository()
})
container.bind<IAdminService>('IAdminService').to(AdminService).inSingletonScope();
container.bind<AdminController>('AdminController').to(AdminController).inSingletonScope();

//Trainer Container
container.bind<ITrainerRepository>('ITrainerRepository').toDynamicValue(()=>{
    return new TrainerRepository()
})
container.bind<ITrainerService>('ITrainerService').to(TrainerService).inSingletonScope();
container.bind<TrainerController>('TrainerController').to(TrainerController).inSingletonScope();

//User Container
container.bind<IUserRepository>('IUserRepository').toDynamicValue(()=>{
    return new UserRepository()
})
container.bind<UserController>('UserController').to(UserController).inSingletonScope();
container.bind<IUserService>('IUserService').to(UserService).inSingletonScope();
container.bind<string>("StripeSecretKey")
  .toConstantValue(process.env.STRIPE_SECRET_KEY!);
container.bind<typeof STRIPE_CONFIG>("StripeConfig")
  .toConstantValue(STRIPE_CONFIG);

//Chat Container
container.bind<IChatRepository>('IChatRepository').toDynamicValue(()=>{
  return new ChatRepository()
})
container.bind<IChatService>('IChatService').to(ChatService).inSingletonScope();
container.bind<ChatController>('ChatController').to(ChatController).inSingletonScope();



export {container}