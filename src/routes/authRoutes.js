import express from "express";
// CORRECCIÓN: ../controllers
import { register, login } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

export default router;