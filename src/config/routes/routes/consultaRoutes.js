// routes/consultaRoutes.js
import { Router } from 'express';
import { authenticate } from '../../../middleware/authMiddleware.js';
import {
  getConsultasByPacienteId,
  createConsulta,
  getConsultaById,
  updateConsultaById,
  deleteConsultaById,
} from '../../controllers/consultaController.js';

const router = Router();

// Todas las rutas de consultas requieren autenticación
// GET /api/consultas/paciente/:pacienteId (Obtener Historial Clínico)
router.get('/paciente/:pacienteId', authenticate, getConsultasByPacienteId);

// POST /api/consultas/paciente/:pacienteId (Registrar Nueva Consulta)
router.post('/paciente/:pacienteId', authenticate, createConsulta);

// GET /api/consultas/:id (Ver Detalle de una Consulta específica)
router.get('/:id', authenticate, getConsultaById);
// PUT /api/consultas/:id (Actualizar Consulta)
router.put('/:id', authenticate, updateConsultaById);
// DELETE /api/consultas/:id (Eliminar Consulta)
router.delete('/:id', authenticate, deleteConsultaById);

export default router;
