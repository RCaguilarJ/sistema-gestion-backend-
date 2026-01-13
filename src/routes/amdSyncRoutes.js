import express from 'express';
import { verifyAmdSignature } from '../middleware/amdSignature.js';
import {
	upsertPacienteFromAmd,
	listSpecialistsForAmd,
	createCitaFromAmd
} from '../controllers/amdSyncController.js';

const router = express.Router();

router.post('/pacientes', verifyAmdSignature, upsertPacienteFromAmd);
router.get('/especialistas', verifyAmdSignature, listSpecialistsForAmd);
router.post('/citas', verifyAmdSignature, createCitaFromAmd);

export default router;
