// routes/pacienteRoutes.js
import { Router } from 'express';
// Usamos 'authenticate', que es el nombre correcto de la función en tu middleware/authMiddleware.js
import { authenticate } from '../../middleware/authMiddleware.js'; 
import {
  getAllPacientes,
  createPaciente,
  getPaciente,       // Función para GET /:id
  updatePaciente,    // Función para PUT /:id
} from '../../controllers/pacienteController.js'; 

const router = Router();

// Todas las rutas de Pacientes requieren que el usuario esté logueado
// GET /api/pacientes/
router.get('/', authenticate, getAllPacientes);

// POST /api/pacientes/
router.post('/', authenticate, createPaciente);

// --- RUTA DINÁMICA CLAVE ---
// GET /api/pacientes/:id (Para ver los detalles del paciente)
router.get('/:id', authenticate, getPaciente); 

// PUT /api/pacientes/:id (Para editar los detalles del paciente)
router.put('/:id', authenticate, updatePaciente);

export default router;