import { Router } from 'express';
// CORRECCIÓN: ../middleware y ../controllers
import { authenticate } from '../middleware/authMiddleware.js'; 
import { authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getCitasByPacienteId,
  createCita,
  updateCitaEstado,
  getPendingCitasForMedico,
} from '../controllers/citaController.js';

const router = Router();

router.get('/paciente/:pacienteId', authenticate, getCitasByPacienteId); 
router.post('/paciente/:pacienteId', authenticate, createCita); 
router.put('/:id/estado', authenticate, updateCitaEstado); 
router.get('/pendientes/mias', authenticate, getPendingCitasForMedico);

export default router;