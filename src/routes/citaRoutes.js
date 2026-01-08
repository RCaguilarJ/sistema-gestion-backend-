import { Router } from 'express';
// CORRECCIÓN: ../middleware y ../controllers
import { authenticate } from '../middleware/authMiddleware.js'; 
import { authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getCitasByPacienteId,
  createCita,
  updateCitaEstado,
} from '../controllers/citaController.js';

const router = Router();

router.get('/paciente/:pacienteId', authenticate, getCitasByPacienteId); 
router.post('/paciente/:pacienteId', authenticate, authorizeRoles('ADMIN'), createCita); 
router.put('/:id/estado', authenticate, authorizeRoles('ADMIN'), updateCitaEstado); 

export default router;