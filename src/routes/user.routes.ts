import { Router } from "express";
import { signupUser, loginUser  } from "../controllers/user.controller.js";
import { requestOtpController, verifyOtpController } from "../controllers/otp.controller.js";
import { getMyProfile, getPublicProfile, updateMyProfile } from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/users", signupUser);
router.post("/auth/login", loginUser);
router.post("/auth/otp/request" , requestOtpController);
router.post("/auth/otp/verify", verifyOtpController);
router.get("/users/me", authenticate, getMyProfile);
router.get("/users/:id", getPublicProfile);
router.patch("/users/me", authenticate, updateMyProfile);


export default router;