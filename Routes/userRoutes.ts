import express from "express";
import { container } from "../config/container";
import { UserController } from "../controller/user/UserController";
import { userProtect } from "../middleware/userAuth";



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
router.get("/getUserDetails/:token",userProtect, userController.getUserDetails);
router.put("/userEditProfile/:id",userProtect, userController.userEditProfile);

// Google Login
router.post('/auth/google', userController.googleAuth);
export default router