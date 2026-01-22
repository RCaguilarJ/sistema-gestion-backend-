// Ruta: src/routes/documentosRoutes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../../../middleware/authMiddleware.js';
import { 
    getDocumentos, 
    uploadDocumento, 
    deleteDocumento 
} from '../../controllers/documentosController.js';

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Los archivos se guardarán en la carpeta 'uploads' en la raíz
  },
  filename: (req, file, cb) => {
    // Guardar con timestamp para evitar nombres duplicados
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const router = Router();

// Rutas
router.get('/:pacienteId', authenticate, getDocumentos);
router.post('/upload', authenticate, upload.single('archivo'), uploadDocumento);
router.delete('/:id', authenticate, deleteDocumento);

export default router;