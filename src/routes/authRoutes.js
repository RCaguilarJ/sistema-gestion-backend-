import { Router } from "express";
import { login } from "../controllers/authController.js";
import { createUser } from "../controllers/userController.js";

const router = Router();

router.post("/login", login);
router.post("/register", createUser);

export default router;
