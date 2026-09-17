import { Router } from "express";
import { signupUser, loginUser  } from "../controllers/user.controller.js";
const router = Router();

router.post("/users", signupUser);
router.post("/auth/login", loginUser);


export default router;