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

// Google Login
router.post('/auth/google', userController.googleAuth);
export default router