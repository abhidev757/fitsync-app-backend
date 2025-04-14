import express from 'express'
import { AdminController } from '../controller/admin/AdminController';
import { container } from '../config/container';
import { adminProtect } from '../middleware/adminAuth';
import { checkRole } from '../middleware/roleMiddleware';
const router = express.Router();


const adminController = container.get<AdminController>('AdminController')



//Admin
router.post('/login', adminController.login)
router.post('/create', adminController.register)
router.post('/logout', adminController.logout)
router.get('/getAllUsers',adminProtect,checkRole(['admin']),adminController.getAllUsers)
router.put('/updateUserStatus/:userId',adminProtect,checkRole(['admin']),adminController.updateUserStatus)
router.get('/getAllTrainers',adminProtect,checkRole(['admin']),adminController.getAllTrainers)
router.put('/updateTrainerStatus/:trainerId',adminProtect,checkRole(['admin']),adminController.updateTrainerStatus)
router.get('/getUser/:id',adminProtect,checkRole(['admin']),adminController.getUser)
router.get('/getTrainer/:id',adminProtect,checkRole(['admin']),adminController.getTrainer)
router.post('/addSpecialization/',adminProtect,checkRole(['admin']),adminController.addSpecialization)
router.get('/getAllSpecializations',adminProtect,checkRole(['admin']), adminController.getAllSpecializations);
router.put('/toggleSpecializationStatus',adminProtect,checkRole(['admin']), adminController.toggleSpecializationStatus);
router.get('/fetchApplicants',adminProtect,checkRole(['admin']), adminController.getAllApplicants);
router.put('/approveTrainer/:id',adminProtect,checkRole(['admin']),adminController.approveTrainer)
router.put('/rejectTrainer/:id',adminProtect,checkRole(['admin']),adminController.rejectTrainer)




export default router;