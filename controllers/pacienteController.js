import Paciente from '../models/Paciente.js';

const allowedGeneros = ['Masculino', 'Femenino', 'Otro'];
const allowedTipoDiabetes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Otro'];
const allowedEstatus = ['Activo', 'Inactivo'];
const allowedRiesgo = ['Alto', 'Medio', 'Bajo'];

function normalizePacientePayload(body = {}, user = null, isUpdate = false) {
  const payload = {};
  const errors = [];

  const nombreRaw = body.nombre || body.nombreCompleto || body.name || body.nombre_paciente;
  const nombre = nombreRaw !== undefined ? String(nombreRaw).trim() : '';
  if (nombre) payload.nombre = nombre;
  else if (!isUpdate) errors.push('Campo requerido: nombre');

  const curpRaw = body.curp;
  const curp = curpRaw !== undefined ? String(curpRaw).trim() : '';
  if (curp) payload.curp = curp;
  else if (!isUpdate) errors.push('Campo requerido: curp');

  if (body.fechaNacimiento) {
    const d = new Date(body.fechaNacimiento);
    if (!isNaN(d)) payload.fechaNacimiento = d.toISOString().slice(0, 10);
    else errors.push('fechaNacimiento inválida');
  }

  if (body.genero) {
    const g = String(body.genero).trim();
    const match = allowedGeneros.find((x) => x.toLowerCase() === g.toLowerCase());
    if (match) payload.genero = match;
    else errors.push('genero inválido');
  }

  ['telefono', 'email', 'calleNumero', 'colonia', 'municipio', 'estado', 'codigoPostal', 'programa', 'tipoTerapia'].forEach((field) => {
    if (body[field] !== undefined) {
      const value = String(body[field] || '').trim();
      if (value.length > 0 || isUpdate) {
        if (field === 'email' && value.length > 0) {
          const emailRegex = /^\S+@\S+\.\S+$/;
          if (emailRegex.test(value)) payload.email = value;
          else errors.push('email inválido');
        } else {
          payload[field] = value.length > 0 ? value : null;
        }
      }
    }
  });

  if (body.tipoDiabetes) {
    const t = String(body.tipoDiabetes).trim();
    const match = allowedTipoDiabetes.find((x) => x.toLowerCase() === t.toLowerCase());
    if (match) payload.tipoDiabetes = match;
    else errors.push('tipoDiabetes inválido');
  }

  ['estaturaCm', 'pesoKg', 'hba1c', 'imc'].forEach((field) => {
    if (body[field] !== undefined && body[field] !== '') {
      const n = parseFloat(body[field]);
      if (!isNaN(n)) payload[field] = n;
      else errors.push(`${field} inválido: debe ser un número.`);
    } else if (isUpdate && body[field] === '') {
      payload[field] = null;
    }
  });

  if (body.estatus) {
    const e = String(body.estatus).trim();
    const match = allowedEstatus.find((x) => x.toLowerCase() === e.toLowerCase());
    if (match) payload.estatus = match;
    else errors.push('estatus inválido');
  }
  if (body.riesgo) {
    const r = String(body.riesgo).trim();
    const match = allowedRiesgo.find((x) => x.toLowerCase() === r.toLowerCase());
    if (match) payload.riesgo = match;
    else errors.push('riesgo inválido');
  }

  if (user && user.role === 'NUTRI') payload.nutriologoId = user.id;
  else if (body.nutriologoId !== undefined) {
    const n = parseInt(body.nutriologoId, 10);
    if (!isNaN(n)) payload.nutriologoId = n;
  } else if (isUpdate && body.nutriologoId === '') {
    payload.nutriologoId = null;
  }

  return { payload, errors };
}

export const getAllPacientes = async (req, res) => {
  try {
    if (req.user && req.user.role === 'NUTRI') {
      const pacientes = await Paciente.findAll({ where: { nutriologoId: req.user.id } });
      return res.status(200).json(pacientes);
    }

    const pacientes = await Paciente.findAll();
    res.status(200).json(pacientes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pacientes', error: error.message });
  }
};

export const createPaciente = async (req, res) => {
  try {
    const { payload, errors } = normalizePacientePayload(req.body, req.user, false);
    if (errors.length) {
      return res.status(400).json({ message: 'Validation error', details: errors });
    }

    const nuevoPaciente = await Paciente.create(payload);
    res.status(201).json(nuevoPaciente);
  } catch (error) {
    console.error('Error al crear paciente:', error);

    if (error.name === 'SequelizeValidationError') {
      const details = error.errors.map((e) => e.message);
      return res.status(400).json({ message: 'Validation error', details });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      const details = error.errors.map((e) => e.message);
      return res.status(409).json({ message: 'Constraint error', details });
    }

    res.status(500).json({ message: 'Error al crear el paciente', error: error.message });
  }
};

export const getPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    let whereClause = { id };
    if (req.user && req.user.role === 'NUTRI') {
      whereClause = { id, nutriologoId: req.user.id };
    }

    const paciente = await Paciente.findOne({ where: whereClause });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado o acceso denegado.' });
    }

    res.status(200).json(paciente);
  } catch (error) {
    console.error('Error al obtener paciente por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
  }
};

export const updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { payload, errors } = normalizePacientePayload(req.body, req.user, true);
    if (errors.length) {
      return res.status(400).json({ message: 'Validation error', details: errors });
    }

    let whereClause = { id };
    if (req.user && req.user.role === 'NUTRI') {
      whereClause = { id, nutriologoId: req.user.id };
    }

    const paciente = await Paciente.findOne({ where: whereClause });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado para actualizar o acceso denegado.' });
    }

    await Paciente.update(payload, { where: whereClause });
    const freshPaciente = await Paciente.findByPk(id);
    res.status(200).json(freshPaciente);
  } catch (error) {
    console.error('Error al actualizar paciente:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      const details = error.errors.map((e) => e.message);
      return res.status(409).json({ message: 'Constraint error', details });
    }

    res.status(500).json({ message: 'Error interno del servidor al actualizar el paciente.', error: error.message });
  }
};