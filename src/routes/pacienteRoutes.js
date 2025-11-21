import { Router } from 'express';
// CORRECCIÓN: ../middleware y ../controllers
import { authenticate } from '../middleware/authMiddleware.js'; 
import {
  getAllPacientes,
  createPaciente,
  getPaciente,
  updatePaciente,
} from '../controllers/pacienteController.js'; 

const router = Router();

router.get('/', authenticate, getAllPacientes);
router.post('/', authenticate, createPaciente);
router.get('/:id', authenticate, getPaciente); 
router.put('/:id', authenticate, updatePaciente);

export default router;