import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { authenticate } from "../../../middleware/authMiddleware.js";
import {
  getAllPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  deletePaciente,
  getPacientesByEspecialista,
  validateImportPacientes,
  importPacientesFromExcel,
} from "../../../controllers/pacienteController.js";

const router = Router();

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${uploadsDir}${path.sep}`);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Proteger todas las rutas con autenticacion
router.use(authenticate);

// IMPORTANTE: rutas especificas ANTES de "/:id"
router.post("/importar/validar", upload.single("archivo"), validateImportPacientes);
router.post("/importar", upload.single("archivo"), importPacientesFromExcel);
router.get("/especialista/:especialistaId", getPacientesByEspecialista);

router.get("/", getAllPacientes);
router.get("/:id", getPacienteById);
router.post("/", createPaciente);
router.put("/:id", updatePaciente);
router.delete("/:id", deletePaciente);

export default router;
