// routes/pacienteRoutes.js
import { Router } from 'express';
// Usamos 'authenticate' (el nombre correcto de la función en tu middleware)
import { authenticate } from '../middleware/authMiddleware.js'; 
import {
  getAllPacientes,
  createPaciente,
  getPaciente,       // Importa el controlador para GET /:id
  updatePaciente,    // Importa el controlador para PUT /:id
} from '../controllers/pacienteController.js'; 

const router = Router();

// NOTA IMPORTANTE: Asegúrate de que el middleware se aplique correctamente en index.js:
// app.use("/api/pacientes", authenticate, pacienteRoutes);
// O si el middleware solo se aplica en las rutas:

// GET /api/pacientes/
router.get('/', authenticate, getAllPacientes);

// POST /api/pacientes/
router.post('/', authenticate, createPaciente);

// --- RUTA DINÁMICA CLAVE ---
// GET /api/pacientes/:id (Para ver los detalles del paciente)
// Express matcheará '/4', '/5', etc., y pondrá el valor en req.params.id
router.get('/:id', authenticate, getPaciente); 

// PUT /api/pacientes/:id (Para editar los detalles del paciente)
router.put('/:id', authenticate, updatePaciente);

export default router;