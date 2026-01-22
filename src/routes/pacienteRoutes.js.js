import { Router } from "express";
import {
  getAllPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  deletePaciente,
  getPacientesByEspecialista,
} from "../../../controllers/pacienteController.js";

const router = Router();

router.get("/especialista/:especialistaId", getPacientesByEspecialista);

router.get("/", getAllPacientes);
router.get("/:id", getPacienteById);
router.post("/", createPaciente);
router.put("/:id", updatePaciente);
router.delete("/:id", deletePaciente);

export default router;