// routes/citaRoutes.js
import { Router } from 'express';
// --- CORRECCIÓN: Usamos 'authenticate' ---
import { authenticate } from '../../middleware/authMiddleware.js'; 
import {
  getCitasByPacienteId,
  createCita,
  updateCitaEstado,
} from '../../controllers/citaController.js';

const router = Router();

// Todas las rutas de citas requieren autenticación
// GET /api/citas/paciente/:pacienteId (Obtener Próximas Citas e Historial)
router.get('/paciente/:pacienteId', authenticate, getCitasByPacienteId); 

// POST /api/citas/paciente/:pacienteId (Agendar Nueva Cita)
router.post('/paciente/:pacienteId', authenticate, createCita); 

// PUT /api/citas/:id/estado (Actualizar el estado de una cita: Confirmada, Cancelada, Completada)
router.put('/:id/estado', authenticate, updateCitaEstado); 

export default router;