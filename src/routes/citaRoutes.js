import { Router } from "express";
import { authenticate, authorizeRoles, forbidRoles } from "../middleware/authMiddleware.js";
import { ADMIN_ROLES, ADMIN_VIEW_ROLES, MEDICAL_ROLES, ROLES } from "../constants/roles.js";
import {
  getCitasByDoctor,
  getCitasAmd,
  getCitasPortal,
  updateCitaEstado,
  updateCita,
  updateCitaPortalEstado,
  createPacienteFromCita,
  getCitasByPacienteId,
  createCitaByPaciente,
  deleteCita,
} from "../controllers/citaController.js";

const router = Router();

router.use(authenticate);

router.get("/doctor/:medicoId", authorizeRoles(...ADMIN_VIEW_ROLES, ...MEDICAL_ROLES), getCitasByDoctor);
router.get("/paciente/:pacienteId", authorizeRoles(...ADMIN_VIEW_ROLES, ...MEDICAL_ROLES), getCitasByPacienteId);
router.get("/amd", authorizeRoles(...ADMIN_VIEW_ROLES, ...MEDICAL_ROLES), getCitasAmd);
router.get("/portal", authorizeRoles(...ADMIN_VIEW_ROLES, ...MEDICAL_ROLES), getCitasPortal);
router.put("/:citaId", authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES), updateCita);
router.put("/:citaId/estado", authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES), updateCitaEstado);
router.put("/portal/:citaId/estado", authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES), updateCitaPortalEstado);
router.post("/portal/:citaId/crear-paciente", authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES), createPacienteFromCita);
router.post("/paciente/:pacienteId", authorizeRoles(...ADMIN_ROLES, ...MEDICAL_ROLES), createCitaByPaciente);
router.delete(
  "/:citaId",
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  deleteCita
);

export default router;
