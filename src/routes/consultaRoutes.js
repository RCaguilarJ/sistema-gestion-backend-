import { Router } from 'express';
// CORRECCIÓN: ../middleware y ../controllers
import { authenticate } from '../middleware/authMiddleware.js'; 
import { authorizeRoles } from '../middleware/authMiddleware.js';
import { ADMIN_ROLES, MEDICAL_ROLES } from '../constants/roles.js';
import {
  getAllConsultas,
  getConsultasByPacienteId,
  createConsulta,
  getConsultaById,
} from '../controllers/consultaController.js'; 

const router = Router();

router.get('/', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getAllConsultas);
router.get('/paciente/:pacienteId', authenticate, getConsultasByPacienteId); 
router.post(
  '/paciente/:pacienteId',
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES),
  createConsulta
); 
router.get('/:id', authenticate, getConsultaById);

export default router;
