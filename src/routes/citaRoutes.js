import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getCitasByDoctor,
  getCitasAmd,
  getCitasPortal,
  updateCitaPortalEstado,
  createPacienteFromCita,
  getCitasByPacienteId,
  createCitaByPaciente,
} from "../controllers/citaController.js";

const router = Router();

router.use(authenticate);

router.get("/doctor/:medicoId", getCitasByDoctor);
router.get("/paciente/:pacienteId", getCitasByPacienteId);
router.get("/amd", getCitasAmd);
router.get("/portal", getCitasPortal);
router.put("/portal/:citaId/estado", updateCitaPortalEstado);
router.post("/portal/:citaId/crear-paciente", createPacienteFromCita);
router.post("/paciente/:pacienteId", createCitaByPaciente);

export default router;
