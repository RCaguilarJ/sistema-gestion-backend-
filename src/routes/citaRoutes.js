import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js'; 
import { authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getCitasByPacienteId,
  createCita,
  updateCitaEstado,
  getPendingCitasForMedico,
  getMisCitas,
  getTodasLasCitas
} from '../controllers/citaController.js';

const router = Router();

// Pacientes: Ver sus propias citas
router.get('/paciente/:pacienteId', authenticate, getCitasByPacienteId); 

// Pacientes: Agendar nueva cita (sin restricción)
router.post('/paciente/:pacienteId', authenticate, createCita); 

// Médicos: Ver solo SUS citas pendientes
router.get('/pendientes/mias', authenticate, getPendingCitasForMedico);

// Médicos: Ver TODAS sus citas (pasadas y futuras)
router.get('/mis-citas', authenticate, getMisCitas);

// Médicos: Actualizar estado de citas
router.put('/:id/estado', authenticate, updateCitaEstado); 

// ADMIN: Ver TODAS las citas del sistema
router.get('/todas', authenticate, authorizeRoles('ADMIN'), getTodasLasCitas);

export default router;