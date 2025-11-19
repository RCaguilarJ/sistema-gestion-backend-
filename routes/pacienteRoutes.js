// routes/pacienteRoutes.js
import { Router } from 'express';
import {
  getAllPacientes,
  createPaciente,
  getPaciente,
  updatePaciente,
} from '../controllers/pacienteController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/pacientes - obtener todos
router.get('/', authenticate, getAllPacientes);

// POST /api/pacientes - crear nuevo
router.post('/', authenticate, createPaciente);

// GET /api/pacientes/:id - obtener por ID
router.get('/:id', authenticate, getPaciente);

// PUT /api/pacientes/:id - actualizar
router.put('/:id', authenticate, updatePaciente);

export default router;
