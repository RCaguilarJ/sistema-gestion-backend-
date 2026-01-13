import { Router } from 'express';
// CORRECCIÓN: ../middleware y ../controllers
import { authenticate } from '../middleware/authMiddleware.js'; 
import { authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getCitasByPacienteId,
  createCita,
  updateCitaEstado,
  getPendingCitasForMedico,
  getMisCitas,
  getAllCitas
} from '../controllers/citaController.js';

const router = Router();

// Citas de un paciente específico (filtrado automático por médico si no es ADMIN)
router.get('/paciente/:pacienteId', authenticate, getCitasByPacienteId);

// Crear cita - Cualquier usuario autenticado puede crear (paciente o médico)
router.post('/paciente/:pacienteId', authenticate, createCita);

// Actualizar estado - Solo médico asignado o ADMIN
router.put('/:id/estado', authenticate, updateCitaEstado);

// Ver citas pendientes del médico logueado
router.get('/pendientes/mias', authenticate, getPendingCitasForMedico);

// Ver TODAS las citas del médico logueado
router.get('/mis-citas', authenticate, getMisCitas);

// Ver TODAS las citas del sistema (solo ADMIN)
router.get('/todas', authenticate, authorizeRoles('ADMIN'), getAllCitas);

export default router;