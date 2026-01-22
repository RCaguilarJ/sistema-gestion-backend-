// routes/nutricionRoutes.js
import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import { ADMIN_ROLES, MEDICAL_ROLES } from '../constants/roles.js';
import { getNutricion, updateNutricion, addPlan } from '../controllers/nutricionController.js';

const router = express.Router();


router.get('/:pacienteId', authenticate, getNutricion);


router.put(
  '/:pacienteId',
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES),
  updateNutricion
);


router.post(
  '/:pacienteId/planes',
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES),
  addPlan
);

export default router;
