// routes/authRoutes.js
import express from "express";
import { login } from "../../../controllers/authController.js";
import { createUser } from "../../../controllers/userController.js";

const router = express.Router();

// Ruta para registrar un nuevo usuario
// POST https://amdj.desingsgdl.app/api/auth/register
router.post("/register", createUser);

// Ruta para iniciar sesión
// POST https://amdj.desingsgdl.app/api/auth/login
router.post("/login", login);

export default router;
    

