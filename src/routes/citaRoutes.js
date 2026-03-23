import { Router } from "express";
import { authenticate, authorizeRoles, forbidRoles } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";
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

router.get("/doctor/:medicoId", getCitasByDoctor);
router.get("/paciente/:pacienteId", getCitasByPacienteId);
router.get("/amd", getCitasAmd);
router.get("/portal", getCitasPortal);
router.put("/:citaId", forbidRoles(ROLES.RECEPCION), updateCita);
router.put("/:citaId/estado", forbidRoles(ROLES.RECEPCION), updateCitaEstado);
router.put("/portal/:citaId/estado", forbidRoles(ROLES.RECEPCION), updateCitaPortalEstado);
router.post("/portal/:citaId/crear-paciente", forbidRoles(ROLES.RECEPCION), createPacienteFromCita);
router.post("/paciente/:pacienteId", forbidRoles(ROLES.RECEPCION), createCitaByPaciente);
router.delete(
  "/:citaId",
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  deleteCita
);

export default router;
