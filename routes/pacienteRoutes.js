// routes/pacienteRoutes.js
import express from "express";
import {
  getAllPacientes,
  createPaciente,
} from "../controllers/pacienteController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Todas las rutas de pacientes requieren autenticación
// GET /api/pacientes
router.get("/", authenticate, getAllPacientes);

// POST /api/pacientes
router.post("/", authenticate, createPaciente);

export default router;
