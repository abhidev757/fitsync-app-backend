import express from "express";
const router = express.Router()
import {inject, injectable} from 'inversify'
import asyncHandler from 'express-async-handler'
import { IAdminService } from "../../interfaces/admin/IAdminService";
import { Request, Response } from "express";
import AdminTokenService from '../../utils/adminTokenService'
import { HttpStatusCode } from "../../enums/HttpStatusCode";
import { StatusMessage } from "../../enums/StatusMessage";
import { IUserService } from "../../interfaces/user/IUserService";
import { UserService } from "../../services/user/UserService";



@injectable()
export class AdminController {
    constructor(@inject('IAdminService')private readonly adminService: IAdminService)  {}
    login = asyncHandler(async(req:Request,res:Response)=>{
        const {email, password} = req.body;
        const admin = await this.adminService.authenticateAdmin(email, password)

        if(admin) {
            const adminAccessToken = AdminTokenService.generateAdminAccessToken(admin._id.toString(),admin.role);
            const adminRefreshToken = AdminTokenService.generateAdminRefreshToken(admin._id.toString(),admin.role);
            AdminTokenService.setAdminTokenCookies(res, adminAccessToken,adminRefreshToken);
            res.status(HttpStatusCode.OK).json({
                _id: admin._id,
                email: admin.email,
                role: admin.role
            })
        }else {
            res.status(HttpStatusCode.UNAUTHORIZED).json({message:StatusMessage.INTERNAL_SERVER_ERROR})
        }
    })
    register = asyncHandler(async (req: Request, res: Response)=>{
        const {email, password} = req.body;
        await this.adminService.registerAdmin(email,password);
    })

    logout = asyncHandler(async (req: Request, res: Response)=>{
        res.cookie("adminAccessToken", "", {
            httpOnly: true,
            expires: new Date(0)
        })
        res.cookie("adminRefreshToken", "", {
            httpOnly: true,
            expires: new Date(0)
        })
        res.status(HttpStatusCode.OK).json({message: StatusMessage.SUCCESS})
        console.log('log Out success');
        
    })

    getAllUsers = asyncHandler(async (req: Request, res: Response) => {
        try {
            const users = await this.adminService.getAllUsers();
            res.status(HttpStatusCode.OK).json(users);
        } catch (error) {
            console.error(error);
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
        }
    });

    updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;
        const { newStatus } = req.body;
        try {
            const updatedUser = await this.adminService.toggleUserStatus(userId, newStatus);
            res.status(HttpStatusCode.OK).json({ message: 'User status updated', user: updatedUser });
        } catch (error) {
            console.error(error);
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
        }
    });
    getAllTrainers = asyncHandler(async (req: Request, res: Response) => {
        try {
            const trainers = await this.adminService.getAllTrainers();
            res.status(HttpStatusCode.OK).json(trainers);
        } catch (error) {
            console.error(error);
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
        }
    });

    updateTrainerStatus = asyncHandler(async (req: Request, res: Response) => {
        const { trainerId } = req.params;
        const { newStatus } = req.body;
        try {
            const updatedTrainer = await this.adminService.toggleTrainerStatus(trainerId, newStatus);
            res.status(HttpStatusCode.OK).json({ message: 'Trainer status updated', user: updatedTrainer });
        } catch (error) {
            console.error(error);
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: StatusMessage.INTERNAL_SERVER_ERROR });
        }
    });

    getUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.id;
            const user = await this.adminService.getUserById(userId);
    
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
    
            res.status(200).json(user);
        } catch (error) {
            console.error("Error fetching user details:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });
    getTrainer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.id;
            const user = await this.adminService.getTrainerById(userId);
    
            if (!user) {
                res.status(404).json({ message: "Trainer not found" });
                return;
            }
    
            res.status(200).json(user);
        } catch (error) {
            console.error("Error fetching trainer details:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    addSpecialization = asyncHandler(async (req: Request, res: Response) => {
        const { name, description } = req.body;
        const specialization = await this.adminService.addSpecialization(name, description);

        if (specialization) {
            res.status(HttpStatusCode.CREATED).json({
                message: 'Specialization added successfully',
                specialization,
            });
        } else {
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                message: 'Failed to add specialization',
            });
        }
    });

    getAllSpecializations = asyncHandler(async (req: Request, res: Response) => {
        const specializations = await this.adminService.getAllSpecializations();
        res.status(HttpStatusCode.OK).json(specializations);
    });

    toggleSpecializationStatus = asyncHandler(async (req: Request, res: Response) => {
       
        const { name,isBlock } = req.body;

        const specialization = await this.adminService.toggleSpecializationStatus(name, isBlock);

        if (specialization) {
            res.status(HttpStatusCode.OK).json({
                message: 'Specialization status updated successfully',
                specialization,
            });
        } else {
            res.status(HttpStatusCode.NOT_FOUND).json({
                message: 'Specialization not found',
            });
        }
    });

    getAllApplicants = asyncHandler(async (req: Request, res: Response) => {
        const applicants = await this.adminService.getAllApplicants();
        console.log("applicants:",applicants);
        
        res.status(HttpStatusCode.OK).json(applicants);
    });

    approveTrainer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.id;
            await this.adminService.approveTrainer(userId);
    
            res.status(200).json({message: "Trainer has been approved"});
        } catch (error) {
            console.error("Error approving trainer:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    rejectTrainer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.id;
            const { reason } = req.body;
    
            if (!reason) {
               
                res.status(400).json({ message: "Reason for rejection is required" });
                return;
            }
    
            await this.adminService.rejectTrainer(userId, reason);
    
          
            res.status(200).json({ message: "Trainer has been rejected" });
        } catch (error) {
            console.error("Error rejecting trainer:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });
    
}