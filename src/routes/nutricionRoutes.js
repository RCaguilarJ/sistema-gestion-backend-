// routes/nutricionRoutes.js
import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import { ADMIN_ROLES, MEDICAL_ROLES } from '../constants/roles.js';
import {
  getNutricion,
  updateNutricion,
  addPlan,
  updatePlan,
  deletePlan,
} from '../controllers/nutricionController.js';

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

router.put(
  '/:pacienteId/planes/:planId',
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES),
  updatePlan
);

router.delete(
  '/:pacienteId/planes/:planId',
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES),
  deletePlan
);

export default router;
