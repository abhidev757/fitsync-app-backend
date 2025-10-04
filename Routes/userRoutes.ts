import express from "express";
import { container } from "../config/container";
import { UserController } from "../controller/user/UserController";
import { userProtect } from "../middleware/userAuth";
import multer from "multer";
import { checkRole } from "../middleware/roleMiddleware";
import { blockCheckMiddleware } from "../middleware/blockMiddleware";


const upload = multer()
const router = express.Router();
const userController = container.get<UserController>('UserController');



//container User
router.post("/auth",userController.authUser);
router.post("/logout",userController.logoutUser);
router.post("/register",userController.registerUser);
router.post("/refresh-token", userController.refreshToken);
router.post("/otpVerification", userController.verifyOTP);
router.post("/resendOtp", userController.resendOTP);
router.post("/password-reset-request", userController.requestPasswordReset);
router.post("/reset-password/:token", userController.resetPassword);
router.post("/saveFitnessData",userController.saveUserFitnessInfo);
//Protected routes
router.get("/getUserDetails/:token",userProtect,checkRole(['user']),blockCheckMiddleware, userController.getUserDetails);
router.put("/userEditProfile/:id",userProtect,checkRole(['user']),blockCheckMiddleware, userController.userEditProfile);
router.get("/getTrainerDetails/:id",userProtect,checkRole(['user']),blockCheckMiddleware, userController.getTrainer);
router.get("/fetchTrainers",userProtect,checkRole(['user']),blockCheckMiddleware, userController.getAllTrainers);
router.post("/create-payment-intent",userProtect,checkRole(['user']),blockCheckMiddleware, userController.createPaymentIntent);
router.post("/create-bookings",userProtect,checkRole(['user']),blockCheckMiddleware, userController.createBooking);
router.get("/get-bookings/:id",userProtect,checkRole(['user']),blockCheckMiddleware, userController.getUserBookings);
router.get("/fetchSpecializations",userProtect,checkRole(['user']),blockCheckMiddleware, userController.getAllSpecializations);
router.post("/changePassword/:id",userProtect,checkRole(['user']),blockCheckMiddleware, userController.changePassword);
router.post("/upload-profile/:userId",userProtect,checkRole(['user']),blockCheckMiddleware, upload.single("profileImage"), userController.uploadProfile);
router.get('/wallet/:id',userProtect,checkRole(['user']),userController.getWalletDetails);
router.get("/get-bookings-details/:id",userProtect,checkRole(['user']),blockCheckMiddleware, userController.getBookingDetails);
router.patch("/cancel-booking/:bookingId", userProtect,checkRole(['user']),userController.cancelBookingByuser);
router.get("/water", userProtect,checkRole(['user']),userController.getWater);
router.post("/water", userProtect,checkRole(['user']),userController.updateWater);
router.post("/sync-google-fit", userProtect,checkRole(['user']),userController.syncGoogleFitData);
router.get("/health-today", userProtect,checkRole(['user']),userController.getTodayHealthData);



// Google Login
router.post('/auth/google', userController.googleAuth);
router.post('/auth/google-fit/code',userProtect,checkRole(['user']),userController.googleAuthCode);
router.post('/auth/google-fit/sync-fit',userProtect,checkRole(['user']),userController.syncGoogleFit);
router.get('/auth/google-fit/health-today',userProtect,checkRole(['user']),userController.getTodayHealthData);
export default router