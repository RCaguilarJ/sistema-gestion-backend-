import fs from "fs";
import multer from 'multer';
import { extname } from "path";
import { Router } from "express";
// CORRECCIÓN: ../ en lugar de ../../
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/authMiddleware.js';
import { getDocumentos, uploadDocumento, deleteDocumento } from '../controllers/documentosController.js';

const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${uploadsDir}/`);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + extname(file.originalname));
  }
});

const upload = multer({ storage });
const router = Router();

router.get('/:pacienteId', authenticate, getDocumentos);
// En documentos de paciente, cualquier rol autenticado puede subir
router.post('/upload', authenticate, upload.single('archivo'), uploadDocumento);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), deleteDocumento);

export default router;
