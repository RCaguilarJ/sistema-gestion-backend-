import { Router } from 'express';
// CORRECCIÓN: ../middleware y ../controllers
import { authenticate } from '../middleware/authMiddleware.js'; 
import { authorizeRoles } from '../middleware/authMiddleware.js';
import { ADMIN_ROLES, ADMIN_VIEW_ROLES, MEDICAL_ROLES } from '../constants/roles.js';
import {
  getAllConsultas,
  getConsultasByPacienteId,
  createConsulta,
  getConsultaById,
  updateConsultaById,
  deleteConsultaById,
} from '../controllers/consultaController.js'; 

const router = Router();

router.get('/', authenticate, authorizeRoles(...ADMIN_VIEW_ROLES), getAllConsultas);
router.get('/paciente/:pacienteId', authenticate, getConsultasByPacienteId); 
router.post(
  '/paciente/:pacienteId',
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES),
  createConsulta
); 
router.get('/:id', authenticate, getConsultaById);
router.put(
  '/:id',
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES),
  updateConsultaById
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES),
  deleteConsultaById
);

export default router;
