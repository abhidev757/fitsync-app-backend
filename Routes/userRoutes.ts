import express from "express";
import { container } from "../config/container";
import multer from "multer";

// Middleware
import { userProtect } from "../middleware/userAuth";
import { checkRole } from "../middleware/roleMiddleware";
import { blockCheckMiddleware } from "../middleware/blockMiddleware";

// Import Classes (Types)
import { UserController } from "../controller/user/UserController";
import { AuthController } from "../controller/user/AuthController";
import { BookingController } from "../controller/user/BookingController";
import { PaymentController } from "../controller/user/PaymentController";
import { FitnessController } from "../controller/user/FitnessController";

const upload = multer();
const router = express.Router();

// Get Instances from Container
const userController = container.get<UserController>(UserController);
const authController = container.get<AuthController>(AuthController);
const bookingController = container.get<BookingController>(BookingController);
const paymentController = container.get<PaymentController>(PaymentController);
const fitnessController = container.get<FitnessController>(FitnessController);


// --- AUTHENTICATION ROUTES (AuthController) ---
router.post("/auth", authController.authUser);
router.post("/logout", authController.logoutUser);
router.post("/register", authController.registerUser);
router.post("/refresh-token", authController.refreshToken);
router.post("/otpVerification", authController.verifyOTP);
router.post("/resendOtp", authController.resendOTP);
router.post("/password-reset-request", authController.requestPasswordReset);
router.post("/reset-password/:token", authController.resetPassword);
router.post("/changePassword/:id", userProtect, checkRole(['user']), blockCheckMiddleware, authController.changePassword);
router.post('/auth/google', authController.googleAuth);


// --- PROFILE & TRAINERS (UserController) ---
router.get("/getUserDetails/:token", userProtect, checkRole(['user']), blockCheckMiddleware, userController.getUserDetails);
router.put("/userEditProfile/:id", userProtect, checkRole(['user']), blockCheckMiddleware, userController.userEditProfile);
router.get("/getTrainerDetails/:id", userProtect, checkRole(['user']), blockCheckMiddleware, userController.getTrainer);
router.get("/fetchTrainers", userProtect, checkRole(['user']), blockCheckMiddleware, userController.getAllTrainers);
router.get("/fetchSpecializations", userProtect, checkRole(['user']), blockCheckMiddleware, userController.getAllSpecializations);
router.post("/upload-profile/:userId", userProtect, checkRole(['user']), blockCheckMiddleware, upload.single("profileImage"), userController.uploadProfile);


// --- BOOKING (BookingController) ---
router.post("/create-bookings", userProtect, checkRole(['user']), blockCheckMiddleware, bookingController.createBooking);
router.get("/get-bookings/:id", userProtect, checkRole(['user']), blockCheckMiddleware, bookingController.getUserBookings);
router.get("/get-bookings-details/:id", userProtect, checkRole(['user']), blockCheckMiddleware, bookingController.getBookingDetails);
router.patch("/cancel-booking/:bookingId", userProtect, checkRole(['user']), bookingController.cancelBookingByuser);


// --- PAYMENTS (PaymentController) ---
router.post("/create-payment-intent", userProtect, checkRole(['user']), blockCheckMiddleware, paymentController.createPaymentIntent);
router.get('/wallet/:id', userProtect, checkRole(['user']), paymentController.getWalletDetails);


// --- FITNESS & GOOGLE FIT (FitnessController) ---
router.post("/saveFitnessData", fitnessController.saveUserFitnessInfo);
router.get("/water", userProtect, checkRole(['user']), fitnessController.getWater);
router.post("/water", userProtect, checkRole(['user']), fitnessController.updateWater);
router.post("/sync-google-fit", userProtect, checkRole(['user']), fitnessController.syncGoogleFit);
router.get("/health-today", userProtect, checkRole(['user']), fitnessController.getTodayHealthData);

// Google Fit Specific
router.post('/auth/google-fit/code', userProtect, checkRole(['user']), fitnessController.googleAuthCode);
router.post('/auth/google-fit/sync-fit', userProtect, checkRole(['user']), fitnessController.syncGoogleFit);
router.get('/auth/google-fit/health-today', userProtect, checkRole(['user']), fitnessController.getTodayHealthData);

export default router;