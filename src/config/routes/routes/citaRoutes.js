// src/config/routes/routes/pacienteRoutes.js
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

// IMPORTANTE: rutas específicas ANTES de "/:id"
router.get("/especialista/:especialistaId", /*verifyToken,*/ getPacientesByEspecialista);

router.get("/", /*verifyToken,*/ getAllPacientes);
router.get("/:id", /*verifyToken,*/ getPacienteById);
router.post("/", /*verifyToken,*/ createPaciente);
router.put("/:id", /*verifyToken,*/ updatePaciente);
router.delete("/:id",  deletePaciente);

export default router;
