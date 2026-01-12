import Paciente from '../models/Paciente.js';
import { normalizePacientePayload } from './pacienteController.js';

export const upsertPacienteFromAmd = async (req, res) => {
  try {
    const { curp } = req.body ?? {};

    if (!curp) {
      return res.status(400).json({ message: 'CURP es obligatorio.' });
    }

    const existing = await Paciente.findOne({ where: { curp } });
    const { payload, errors } = normalizePacientePayload(req.body, null, Boolean(existing));

    if (!existing && !payload.nombre) {
      return res.status(400).json({ message: 'Nombre es obligatorio para altas.' });
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Error de validación', details: errors });
    }

    if (existing) {
      await existing.update(payload);
      return res.json({ message: 'Paciente actualizado vía AMD', paciente: existing });
    }

    const created = await Paciente.create(payload);
    return res.status(201).json({ message: 'Paciente creado vía AMD', paciente: created });
  } catch (error) {
    console.error('Error AMD sync paciente:', error);
    return res.status(500).json({ message: 'Error sincronizando paciente', error: error.message });
  }
};
