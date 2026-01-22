// routes/authRoutes.js
import express from "express";
import { login } from "../../../controllers/authController.js";
import { createUser } from "../../../controllers/userController.js";

const router = express.Router();

// Ruta para registrar un nuevo usuario
// POST https://back.diabetesjalisco.org/api/auth/register
router.post("/register", createUser);

// Ruta para iniciar sesión
// POST https://back.diabetesjalisco.org/api/auth/login
router.post("/login", login);

export default router;
    
