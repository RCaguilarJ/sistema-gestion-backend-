import express from "express";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { ADMIN_ROLES, ROLES } from "../constants/roles.js";
import {
  getPsicologia,
  addSesion,
  addEvaluacion,
  addObjetivo,
  addEstrategia,
  addNota,
} from "../controllers/psicologiaController.js";

const router = express.Router();

router.get("/:pacienteId", authenticate, getPsicologia);

router.post(
  "/:pacienteId/sesiones",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  addSesion
);

router.post(
  "/:pacienteId/evaluaciones",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  addEvaluacion
);

router.post(
  "/:pacienteId/objetivos",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  addObjetivo
);

router.post(
  "/:pacienteId/estrategias",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  addEstrategia
);

router.post(
  "/:pacienteId/notas",
  authenticate,
  authorizeRoles(...ADMIN_ROLES, ROLES.PSICOLOGO, ROLES.PSY),
  addNota
);

export default router;
