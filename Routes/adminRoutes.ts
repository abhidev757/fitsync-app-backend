import express from 'express'
import { AdminController } from '../controller/admin/AdminController';
import { container } from '../config/container';
const router = express.Router();


const adminController = container.get<AdminController>('AdminController')



//Admin
router.post('/login', adminController.login)
router.post('/create', adminController.register)
router.post('/logout', adminController.logout)
router.get('/getAllUsers',adminController.getAllUsers)
router.put('/updateUserStatus/:userId',adminController.updateUserStatus)
router.get('/getAllTrainers',adminController.getAllTrainers)
router.put('/updateTrainerStatus/:trainerId',adminController.updateTrainerStatus)
router.get('/getUser/:id',adminController.getUser)
router.get('/getTrainer/:id',adminController.getTrainer)




export default router;