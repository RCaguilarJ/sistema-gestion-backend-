// routes/authRoutes.js
import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

// Ruta para registrar un nuevo usuario
// POST http://localhost:4000/api/auth/register
router.post("/register", register);

// Ruta para iniciar sesión
// POST http://localhost:4000/api/auth/login
router.post("/login", login);

export default router;
