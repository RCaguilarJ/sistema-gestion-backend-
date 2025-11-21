import express from "express";
import {
  getConsultasByPacienteId,
  createConsulta,
  getConsultaById,
} from "../controllers/consultaController.js";

const router = express.Router();

// 🔍 Obtener historial clínico
router.get("/paciente/:pacienteId", getConsultasByPacienteId);

// ✅ Registrar nueva consulta
router.post("/paciente/:pacienteId", createConsulta);

// 🔍 Obtener detalle de una consulta
router.get("/:id", getConsultaById);

export default router;
