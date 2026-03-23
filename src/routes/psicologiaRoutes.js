import express from "express";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { ADMIN_ROLES, ROLES } from "../constants/roles.js";
import {
  getPsicologia,
  addSesion,
  updateSesion,
  deleteSesion,
  addEvaluacion,
  addObjetivo,
  addEstrategia,
  addNota,
  updateNota,
  updateEvaluacion,
  updateObjetivo,
  updateEstrategia,
  deleteEvaluacion,
  deleteObjetivo,
  deleteEstrategia,
  deleteNota,
} from "../controllers/psicologiaController.js";

const router = express.Router();

router.get("/:pacienteId", authenticate, getPsicologia);

router.post(
  "/:pacienteId/sesiones",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  addSesion
);
router.put(
  "/:pacienteId/sesiones/:sesionId",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  updateSesion
);
router.delete(
  "/:pacienteId/sesiones/:sesionId",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  deleteSesion
);

router.post(
  "/:pacienteId/evaluaciones",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  addEvaluacion
);
router.put(
  "/:pacienteId/evaluaciones/:evaluacionId",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  updateEvaluacion
);
router.delete(
  "/:pacienteId/evaluaciones/:evaluacionId",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  deleteEvaluacion
);

router.post(
  "/:pacienteId/objetivos",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  addObjetivo
);
router.put(
  "/:pacienteId/objetivos/:objetivoId",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  updateObjetivo
);
router.delete(
  "/:pacienteId/objetivos/:objetivoId",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  deleteObjetivo
);

router.post(
  "/:pacienteId/estrategias",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  addEstrategia
);
router.put(
  "/:pacienteId/estrategias/:estrategiaId",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  updateEstrategia
);
router.delete(
  "/:pacienteId/estrategias/:estrategiaId",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  deleteEstrategia
);

router.post(
  "/:pacienteId/notas",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY, ROLES.DOCTOR),
  addNota
);
router.put(
  "/:pacienteId/notas/:notaId",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY, ROLES.DOCTOR),
  updateNota
);
router.delete(
  "/:pacienteId/notas/:notaId",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY, ROLES.DOCTOR),
  deleteNota
);

export default router;
