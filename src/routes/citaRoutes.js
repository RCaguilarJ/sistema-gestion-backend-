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
<<<<<<< HEAD
router.post('/paciente/:pacienteId', authenticate, createCita); 
router.put('/:id/estado', authenticate, updateCitaEstado); 
router.get('/pendientes/mias', authenticate, getPendingCitasForMedico);
=======
router.post('/paciente/:pacienteId', authenticate, authorizeRoles('ADMIN'), createCita); 
router.put('/:id/estado', authenticate, authorizeRoles('ADMIN'), updateCitaEstado); 
>>>>>>> 7b3ff6ba8231b0ba67ff0482d876ff4cec9cc648

export default router;