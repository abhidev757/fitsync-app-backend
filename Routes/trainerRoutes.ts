import express from "express";
import { container } from "../config/container";
import multer from "multer";

// Middleware
import { trainerProtect } from "../middleware/trainerAuth";
import { checkRole } from "../middleware/roleMiddleware";
import { blockCheckMiddleware } from "../middleware/blockMiddleware";

//Controller Classes
import { TrainerAuthController } from "../controller/trainer/TrainerAuthController";
import { TrainerProfileController } from "../controller/trainer/TrainerProfileController";
import { TrainerBookingController } from "../controller/trainer/TrainerBookingController";
import { TrainerScheduleController } from "../controller/trainer/TrainerScheduleController";
import { TrainerPaymentController } from "../controller/trainer/TrainerPaymentController";

const upload = multer();
const router = express.Router();

// Get Instances from Container
const trainerAuthController = container.get<TrainerAuthController>(TrainerAuthController);
const trainerProfileController = container.get<TrainerProfileController>(TrainerProfileController);
const trainerBookingController = container.get<TrainerBookingController>(TrainerBookingController);
const trainerScheduleController = container.get<TrainerScheduleController>(TrainerScheduleController);
const trainerPaymentController = container.get<TrainerPaymentController>(TrainerPaymentController);


// --- AUTHENTICATION (TrainerAuthController) ---
router.post("/trainerAuth", trainerAuthController.authTrainer);
router.post("/logoutTrainer", trainerAuthController.logoutTrainer);
router.post("/trainerRegister", trainerAuthController.registerTrainer);
router.post("/trainerOtpVerification", trainerAuthController.verifyOTP);
router.post("/trainerResendOtp", trainerAuthController.resendOTP);
router.post("/trainerPassword-reset-request", trainerAuthController.requestPasswordReset);
router.post("/trainerReset-password/:token", trainerAuthController.resetPassword);
router.post("/trainer-Refresh-token", trainerAuthController.refreshToken);
router.post('/auth/google', trainerAuthController.googleAuth);


// --- PROFILE & UPLOADS (TrainerProfileController) ---
router.post("/upload-certificate", upload.single("certificate"), trainerProfileController.uploadCertificate);
router.post("/upload-profile", upload.single("profileImage"), trainerProfileController.uploadProfile);
router.get("/getTrainerDetails/:id", trainerProtect, checkRole(['trainer']), blockCheckMiddleware, trainerProfileController.getTrainerDetails);
router.put("/trainerEditProfile/:id", trainerProtect, checkRole(['trainer']), blockCheckMiddleware, trainerProfileController.trainerEditProfile);


// --- SCHEDULING (TrainerScheduleController) ---
router.post("/addTimeSlot", trainerProtect, checkRole(['trainer']), blockCheckMiddleware, trainerScheduleController.addTimeSlot);
router.get("/getTimeSlots", trainerProtect, checkRole(['trainer']), blockCheckMiddleware, trainerScheduleController.getTimeSlots);
router.delete("/deleteTimeSlot/:id", trainerProtect, checkRole(['trainer']), blockCheckMiddleware, trainerScheduleController.deleteTimeSlot);


// --- BOOKINGS (TrainerBookingController) ---
router.get("/get-trainerBookings/:id", trainerProtect, checkRole(['trainer']), blockCheckMiddleware, trainerBookingController.getTrainerBookings);
router.get("/get-bookings-details/:id", trainerProtect, checkRole(['trainer']), blockCheckMiddleware, trainerBookingController.getBookingDetails);
router.patch("/cancel-booking/:bookingId", trainerProtect, checkRole(['trainer']), trainerBookingController.cancelBookingByTrainer);
router.patch("/complete-session/:bookingId", trainerProtect, checkRole(['trainer']), trainerBookingController.completeBookingByTrainer);


// --- PAYMENTS & WALLET (TrainerPaymentController) ---
router.get('/wallet/:id', trainerProtect, checkRole(['trainer']), trainerPaymentController.getWalletDetails);
router.post('/request-payout', trainerProtect, checkRole(['trainer']), trainerPaymentController.requestPayout);

export default router;