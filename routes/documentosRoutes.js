// routes/documentosRoutes.js
import express from 'express';
import multer from 'multer';
import { getDocumentos, uploadDocumento, deleteDocumento } from '../controllers/documentosController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/:pacienteId', getDocumentos);
router.post('/upload', upload.single('archivo'), uploadDocumento);
router.delete('/:id', deleteDocumento);

export default router;
