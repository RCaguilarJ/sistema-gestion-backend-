import { Op } from 'sequelize';
import Paciente from '../models/Paciente.js';
import User from '../models/User.js';
import Cita from '../models/Cita.js';

const specialistRoles = ['DOCTOR', 'NUTRI', 'ENDOCRINOLOGO', 'PODOLOGO', 'PSICOLOGO'];

const normalizeEstado = (estado) => {
  if (!estado) return null;
  const value = estado.toString().trim().toLowerCase();
  if (value === 'pendiente') return 'Pendiente';
  if (value === 'confirmada' || value === 'confirmado') return 'Confirmada';
  if (value === 'cancelada' || value === 'cancelado') return 'Cancelada';
  if (value === 'completada' || value === 'completado') return 'Completada';
  return null;
};

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

export const listSpecialistsForAmd = async (req, res) => {
  try {
    const especialistas = await User.findAll({
      where: {
        role: { [Op.in]: specialistRoles },
        estatus: 'Activo'
      },
      attributes: ['id', 'nombre', 'email', 'username', 'role']
    });

    res.json({ especialistas });
  } catch (error) {
    console.error('Error obteniendo especialistas AMD:', error);
    res.status(500).json({ message: 'Error obteniendo especialistas', error: error.message });
  }
};

export const createCitaFromAmd = async (req, res) => {
  try {
    const {
      pacienteId,
      pacienteCurp,
      medicoId,
      medicoUsername,
      medicoRole,
      fechaHora,
      motivo,
      notas,
      estado
    } = req.body ?? {};

    if (!fechaHora || !motivo) {
      return res.status(400).json({ message: 'Los campos fechaHora y motivo son obligatorios.' });
    }

    let paciente = null;
    if (pacienteId) {
      paciente = await Paciente.findByPk(pacienteId);
    } else if (pacienteCurp) {
      paciente = await Paciente.findOne({ where: { curp: pacienteCurp } });
    }

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado para agendar.' });
    }

    let medico = null;
    if (medicoId) {
      medico = await User.findByPk(medicoId);
    }

    if (!medico && medicoUsername) {
      medico = await User.findOne({ where: { username: medicoUsername } });
    }

    if (!medico && medicoRole && specialistRoles.includes(medicoRole)) {
      medico = await User.findOne({
        where: {
          role: medicoRole,
          estatus: 'Activo'
        },
        order: [['updatedAt', 'DESC']]
      });
    }

    if (!medico) {
      return res.status(404).json({ message: 'Especialista no encontrado para agendar.' });
    }

    const nuevaCita = await Cita.create({
      pacienteId: paciente.id,
      medicoId: medico.id,
      fechaHora: new Date(fechaHora),
      motivo,
      notas,
      estado: normalizeEstado(estado) || 'Pendiente'
    });

    res.status(201).json({ message: 'Cita creada vía AMD', cita: nuevaCita });
  } catch (error) {
    console.error('Error AMD creando cita:', error);
    res.status(500).json({ message: 'Error sincronizando cita', error: error.message });
  }
};
