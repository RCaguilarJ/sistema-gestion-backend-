import express from 'express';
import { verifyAmdSignature } from '../middleware/amdSignature.js';
import { upsertPacienteFromAmd } from '../controllers/amdSyncController.js';

const router = express.Router();

router.post('/pacientes', verifyAmdSignature, upsertPacienteFromAmd);

export default router;
