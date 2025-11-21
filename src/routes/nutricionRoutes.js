// routes/nutricionRoutes.js
import express from 'express';
import { getNutricion, updateNutricion, addPlan } from '../controllers/nutricionController.js';

const router = express.Router();

// Obtener información nutricional de un paciente
router.get('/:pacienteId', getNutricion);

// Actualizar datos básicos nutricionales (imc, nutriologo, estado)
router.put('/:pacienteId', updateNutricion);

// Añadir un plan de alimentación
router.post('/:pacienteId/planes', addPlan);

export default router;
