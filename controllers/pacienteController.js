// controllers/pacienteController.js
import Paciente from '../models/Paciente.js';

// Helper: normalize and validate incoming paciente payloads
const allowedGeneros = ['Masculino', 'Femenino', 'Otro'];
const allowedTipoDiabetes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Otro'];
const allowedEstatus = ['Activo', 'Inactivo'];
const allowedRiesgo = ['Alto', 'Medio', 'Bajo'];

function normalizePacientePayload(body = {}, user = null) {
  const payload = {};
  const errors = [];

  // Nombre: accept several possible keys
  const nombreRaw = body.nombre || body.nombreCompleto || body.name || body.nombre_paciente;
  const nombre = nombreRaw !== undefined ? String(nombreRaw).trim() : '';
  if (nombre) payload.nombre = nombre;
  else errors.push('Campo requerido: nombre');

  // CURP (required)
  const curpRaw = body.curp;
  const curp = curpRaw !== undefined ? String(curpRaw).trim() : '';
  if (curp) payload.curp = curp;
  else errors.push('Campo requerido: curp');

  // Fecha de nacimiento: try to coerce to YYYY-MM-DD
  if (body.fechaNacimiento) {
    const d = new Date(body.fechaNacimiento);
    if (!isNaN(d)) payload.fechaNacimiento = d.toISOString().slice(0, 10);
    else errors.push('fechaNacimiento inválida');
  }

  // Genero: normalize to allowed values
  if (body.genero) {
    const g = String(body.genero).trim();
    const match = allowedGeneros.find(x => x.toLowerCase() === g.toLowerCase());
    if (match) payload.genero = match;
    else errors.push('genero inválido');
  }

  // Contacto
  if (body.telefono) payload.telefono = String(body.telefono).trim();
  if (body.email) {
    const email = String(body.email).trim();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (emailRegex.test(email)) payload.email = email;
    else errors.push('email inválido');
  }

  // Domicilio y cadenas opcionales
  ['calleNumero', 'colonia', 'municipio', 'estado', 'codigoPostal', 'programa', 'tipoTerapia'].forEach((f) => {
    if (body[f] !== undefined && body[f] !== null) payload[f] = String(body[f]).trim();
  });

  // Tipo de diabetes (enum)
  if (body.tipoDiabetes) {
    const t = String(body.tipoDiabetes).trim();
    const match = allowedTipoDiabetes.find(x => x.toLowerCase() === t.toLowerCase());
    if (match) payload.tipoDiabetes = match;
    else errors.push('tipoDiabetes inválido');
  }

  // Números: estatura, peso, hba1c, imc
  if (body.estaturaCm !== undefined) {
    const n = parseInt(body.estaturaCm, 10);
    if (!isNaN(n)) payload.estaturaCm = n;
    else errors.push('estaturaCm inválida');
  }
  if (body.pesoKg !== undefined) {
    const n = parseFloat(body.pesoKg);
    if (!isNaN(n)) payload.pesoKg = n;
    else errors.push('pesoKg inválido');
  }
  if (body.hba1c !== undefined) {
    const n = parseFloat(body.hba1c);
    if (!isNaN(n)) payload.hba1c = n;
    else errors.push('hba1c inválido');
  }
  if (body.imc !== undefined) {
    const n = parseFloat(body.imc);
    if (!isNaN(n)) payload.imc = n;
    else errors.push('imc inválido');
  }

  // estatus / riesgo enums
  if (body.estatus) {
    const e = String(body.estatus).trim();
    const match = allowedEstatus.find(x => x.toLowerCase() === e.toLowerCase());
    if (match) payload.estatus = match;
    else errors.push('estatus inválido');
  }
  if (body.riesgo) {
    const r = String(body.riesgo).trim();
    const match = allowedRiesgo.find(x => x.toLowerCase() === r.toLowerCase());
    if (match) payload.riesgo = match;
    else errors.push('riesgo inválido');
  }

  // nutriologoId: if user is NUTRI, override; otherwise accept numeric if provided
  if (user && user.role === 'NUTRI') payload.nutriologoId = user.id;
  else if (body.nutriologoId !== undefined) {
    const n = parseInt(body.nutriologoId, 10);
    if (!isNaN(n)) payload.nutriologoId = n;
  }

  return { payload, errors };
}

// Nota: los endpoints de pacientes deben ser protegidos mediante middleware
// que añade `req.user` (id, email, role). Aquí usamos `req.user.role` para
// filtrar cuando el usuario es NUTRI.

// --- OBTENER TODOS LOS PACIENTES ---
export const getAllPacientes = async (req, res) => {
  try {
    // Si el usuario es nutriólogo, devolvemos solo sus pacientes
    if (req.user && req.user.role === 'NUTRI') {
      const pacientes = await Paciente.findAll({ where: { nutriologoId: req.user.id } });
      return res.status(200).json(pacientes);
    }

    // Para ADMIN/DOCTOR y otros roles permitidos devolvemos todos
    const pacientes = await Paciente.findAll();
    
    // 2. Envía los pacientes como respuesta JSON
    // (Nota: A diferencia de Strapi, no anidamos los datos. Es un array simple)
    res.status(200).json(pacientes);

  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pacientes', error: error.message });
  }
};

// --- CREAR UN NUEVO PACIENTE ---
// (Esta la usaremos para el botón "Nuevo Paciente")
export const createPaciente = async (req, res) => {
  try {
    const { payload, errors } = normalizePacientePayload(req.body, req.user);
    if (errors.length) {
      return res.status(400).json({ message: 'Validation error', details: errors });
    }

    const nuevoPaciente = await Paciente.create(payload);
    res.status(201).json(nuevoPaciente);
  } catch (error) {
    console.error('Error al crear paciente:', error);

    // Manejar errores de validación de Sequelize de forma amigable
    if (error.name === 'SequelizeValidationError') {
      const details = error.errors.map((e) => e.message);
      return res.status(400).json({ message: 'Validation error', details });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      const details = error.errors.map((e) => e.message);
      return res.status(409).json({ message: 'Constraint error', details });
    }

    res.status(400).json({ message: 'Error al crear el paciente', error: error.message });
  }
};

// (Aquí pondremos getPacienteById, updatePaciente, etc. después)