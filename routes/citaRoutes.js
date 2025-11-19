// routes/citaRoutes.js
import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js'; 
// Importa las funciones del controlador de citas
import {
  getCitasByPacienteId,
  createCita,
  updateCitaEstado,
} from '../controllers/citaController.js';

const router = Router();

// GET /api/citas/paciente/:pacienteId 
router.get('/paciente/:pacienteId', authenticate, getCitasByPacienteId); 

// POST /api/citas/paciente/:pacienteId 
router.post('/paciente/:pacienteId', authenticate, createCita); 

// PUT /api/citas/:id/estado 
router.put('/:id/estado', authenticate, updateCitaEstado); 

export default router;