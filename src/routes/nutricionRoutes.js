// routes/nutricionRoutes.js
import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import { getNutricion, updateNutricion, addPlan } from '../controllers/nutricionController.js';

const router = express.Router();

// Obtener información nutricional de un paciente
router.get('/:pacienteId', authenticate, getNutricion);

// Actualizar datos básicos nutricionales (imc, nutriologo, estado)
router.put('/:pacienteId', authenticate, authorizeRoles('ADMIN'), updateNutricion);

// Añadir un plan de alimentación
router.post('/:pacienteId/planes', authenticate, authorizeRoles('ADMIN'), addPlan);

export default router;
