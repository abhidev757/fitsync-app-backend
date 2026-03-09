import dotenv from "dotenv"
dotenv.config()
import express, { Request, Response } from 'express';
import adminRoutes from "./Routes/adminRoutes"
import trainerRoutes from "./Routes/trainerRoutes"
import userRoutes from "./Routes/userRoutes"
import chatRoutes from "./Routes/chatRoutes"
import videoRoutes from "./Routes/videoRoutes"
import notificationRoutes from "./Routes/notificationRoutes"
import cors from "cors"
import morgan from "morgan"
import cookieParser from "cookie-parser";
import {app,server} from './config/socket'



const corsOptions = {
    origin: ["http://localhost:3001", "https://accounts.google.com"], 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], 
    credentials: true,
  };
  
  app.use(cors(corsOptions));
  
const PORT = process.env.PORT || 4000
import connectDB from './config/db'

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());
app.use(morgan('dev'));
app.get('/',(req: Request,res: Response)=>{
    res.send('Server is ready')
})

app.use("/api/admin", adminRoutes);
app.use("/api/trainer", trainerRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/notifications", notificationRoutes);

server.listen(PORT,()=>{
    console.log(`Server is listening to port: ${PORT}`);
})




import { container } from './config/container';
import { CronService } from './services/CronService';

connectDB()
  .then(() => {
    // Initialize Cron Jobs
    const cronService = container.get<CronService>(CronService);
    cronService.startCronJobs();
  });