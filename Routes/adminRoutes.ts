import express from 'express'
import { AdminController } from '../controller/admin/AdminController';
import { ReviewController } from '../controller/user/ReviewController';
import { container } from '../config/container';
import { adminProtect } from '../middleware/adminAuth';
import { checkRole } from '../middleware/roleMiddleware';

const router = express.Router();

const adminController = container.get<AdminController>('AdminController')
const reviewController = container.get<ReviewController>(ReviewController)

//public routes
router.post('/login', adminController.login)
router.post('/create', adminController.register)
router.post('/logout', adminController.logout)

//protected routes
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
router.get('/payout-requests',adminProtect,checkRole(['admin']),adminController.getAllPayoutRequests)
router.put('/payout-request/:id/approve',adminProtect,checkRole(['admin']),adminController.approvePayoutRequest)
router.put('/payout-request/:id/reject',adminProtect,checkRole(['admin']),adminController.rejectPayoutRequest)
router.get('/user-payout-requests',adminProtect,checkRole(['admin']),adminController.getAllUserPayoutRequests)
router.put('/user-payout-request/:id/approve',adminProtect,checkRole(['admin']),adminController.approveUserPayoutRequest)
router.put('/user-payout-request/:id/reject',adminProtect,checkRole(['admin']),adminController.rejectUserPayoutRequest)

// Trainer Reviews
router.get('/trainer-reviews/:trainerId', adminProtect, checkRole(['admin']), reviewController.getReviewsByTrainer)

export default router;