// routes/consultaRoutes.js
import { Router } from 'express';
// --- CORRECCIÓN: El módulo exporta 'authenticate', no 'authenticateToken' ---
import { authenticate } from '../middleware/authMiddleware.js'; 
import {
  getConsultasByPacienteId,
  createConsulta,
  getConsultaById,
} from '../controllers/consultaController.js'; 

const router = Router();

// Todas las rutas de consultas requieren autenticación
// GET /api/consultas/paciente/:pacienteId (Obtener Historial Clínico)
router.get('/paciente/:pacienteId', authenticate, getConsultasByPacienteId); 

// POST /api/consultas/paciente/:pacienteId (Registrar Nueva Consulta)
router.post('/paciente/:pacienteId', authenticate, createConsulta); 

// GET /api/consultas/:id (Ver Detalle de una Consulta específica)
router.get('/:id', authenticate, getConsultaById);

export default router;