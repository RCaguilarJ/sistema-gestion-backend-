import { Router } from 'express';
// CORRECCIÓN: ../middleware y ../controllers
import { authenticate } from '../middleware/authMiddleware.js'; 
import { authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getConsultasByPacienteId,
  createConsulta,
  getConsultaById,
} from '../controllers/consultaController.js'; 

const router = Router();

router.get('/paciente/:pacienteId', authenticate, getConsultasByPacienteId); 
router.post('/paciente/:pacienteId', authenticate, authorizeRoles('ADMIN'), createConsulta); 
router.get('/:id', authenticate, getConsultaById);

export default router;