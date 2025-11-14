// routes/pacienteRoutes.js
import express from 'express';
import { getAllPacientes, createPaciente } from '../controllers/pacienteController.js';

const router = express.Router();

// GET /api/pacientes
router.get('/', getAllPacientes);

// POST /api/pacientes
router.post('/', createPaciente);

export default router;