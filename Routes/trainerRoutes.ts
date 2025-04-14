import express from "express";
import { container } from "../config/container";
import { TrainerController } from "../controller/trainer/TrainerController";
import { trainerProtect } from "../middleware/trainerAuth";
import multer from "multer";
import { checkRole } from "../middleware/roleMiddleware";
import { blockCheckMiddleware } from "../middleware/blockMiddleware";


const upload = multer()
const router = express.Router();
const trainerController = container.get<TrainerController>('TrainerController');



//container Trainer
router.post("/trainerAuth",trainerController.authTrainer);
router.post("/logoutTrainer",trainerController.logoutTrainer);
router.post("/trainerRegister",trainerController.registerTrainer);
router.post("/trainerOtpVerification", trainerController.verifyOTP);
router.post("/trainerResendOtp", trainerController.resendOTP);
router.post("/trainerPassword-reset-request", trainerController.requestPasswordReset);
router.post("/trainerReset-password/:token", trainerController.resetPassword);
router.post("/trainer-Refresh-token", trainerController.refreshToken);
router.post("/upload-certificate", upload.single("certificate"), trainerController.uploadCertificate);
router.post("/upload-profile", upload.single("profileImage"), trainerController.uploadProfile);

//protected routes
router.get("/getTrainerDetails/:id",trainerProtect,checkRole(['trainer']),blockCheckMiddleware, trainerController.getTrainerDetails);
router.put("/trainerEditProfile/:id",trainerProtect,checkRole(['trainer']),blockCheckMiddleware, trainerController.trainerEditProfile);
router.post("/addTimeSlot",trainerProtect,checkRole(['trainer']),blockCheckMiddleware, trainerController.addTimeSlot);
router.get("/getTimeSlots",trainerProtect,checkRole(['trainer']),blockCheckMiddleware, trainerController.getTimeSlots);
router.get("/get-trainerBookings/:id",trainerProtect,checkRole(['trainer']),blockCheckMiddleware, trainerController.getTrainerBookings);
router.get("/get-bookings-details/:id",trainerProtect,checkRole(['trainer']),blockCheckMiddleware, trainerController.getBookingDetails);
router.get("/get-bookings-details/:id",trainerProtect,checkRole(['trainer']),blockCheckMiddleware, trainerController.getBookingDetails);
router.patch("/cancel-booking/:bookingId", trainerProtect,checkRole(['trainer']),trainerController.cancelBookingByTrainer);
router.get('/wallet/:id',trainerProtect,checkRole(['trainer']),trainerController.getWalletDetails);

// Google Login
router.post('/auth/google', trainerController.googleAuth);
export default router

 