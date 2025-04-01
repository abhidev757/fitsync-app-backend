import express from "express";
import { container } from "../config/container";
import { TrainerController } from "../controller/trainer/TrainerController";
import multer from "multer";


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
router.get("/getTrainerDetails/:id", trainerController.getTrainerDetails);
router.put("/trainerEditProfile/:id", trainerController.trainerEditProfile);
router.post("/upload-certificate", upload.single("certificate"), trainerController.uploadCertificate);
router.post("/upload-profile", upload.single("profileImage"), trainerController.uploadProfile);
router.post("/addTimeSlot", trainerController.addTimeSlot);
router.get("/getTimeSlots", trainerController.getTimeSlots);
router.get("/get-trainerBookings/:id", trainerController.getTrainerBookings);
router.get("/get-bookings-details/:id", trainerController.getBookingDetails);


// Google Login
router.post('/auth/google', trainerController.googleAuth);
export default router

 