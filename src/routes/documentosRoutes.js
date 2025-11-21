import { Router } from 'express';
import multer from 'multer';
import path from 'path';
// CORRECCIÓN: ../ en lugar de ../../
import { authenticate } from '../middleware/authMiddleware.js';
import { getDocumentos, uploadDocumento, deleteDocumento } from '../controllers/documentosController.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const router = Router();

router.get('/:pacienteId', authenticate, getDocumentos);
router.post('/upload', authenticate, upload.single('archivo'), uploadDocumento);
router.delete('/:id', authenticate, deleteDocumento);

export default router;