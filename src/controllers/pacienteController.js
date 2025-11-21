import Paciente from '../models/Paciente.js';

const allowedGeneros = ['Masculino', 'Femenino', 'Otro'];
const allowedEstatus = ['Activo', 'Inactivo'];
const allowedRiesgo = ['Alto', 'Medio', 'Bajo'];

function normalizePacientePayload(body = {}, user = null, isUpdate = false) {
  const payload = {};
  const errors = [];

  // --- 1. Datos Personales ---
  const nombre = body.nombre ? String(body.nombre).trim() : '';
  if (nombre) payload.nombre = nombre;
  else if (!isUpdate) errors.push('Campo requerido: Nombre');

  const curp = body.curp ? String(body.curp).trim() : '';
  if (curp) payload.curp = curp;
  else if (!isUpdate) errors.push('Campo requerido: CURP');

  if (body.fechaNacimiento) payload.fechaNacimiento = body.fechaNacimiento;
  
  if (body.genero) {
    const g = String(body.genero).trim();
    if (allowedGeneros.includes(g)) payload.genero = g;
  }

  // --- 2. Contacto y Domicilio ---
  // Agregamos 'celular' a la lista de campos permitidos
  ['telefono', 'celular', 'email', 'calleNumero', 'colonia', 'municipio', 'estado', 'codigoPostal'].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  // --- 3. Programa y Servicio (¡NUEVOS CAMPOS!) ---
  ['grupo', 'tipoServicio', 'tipoTerapia', 'responsable', 'motivoConsulta'].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  // --- 4. Fechas y Datos Clínicos ---
  ['mesEstadistico', 'fechaDiagnostico', 'tipoDiabetes'].forEach((field) => {
    if (body[field] !== undefined) payload[field] = body[field];
  });

  // Booleano "Primera Vez"
  if (body.primeraVez !== undefined) {
    payload.primeraVez = Boolean(body.primeraVez);
  }

  // Datos Numéricos
  ['estaturaCm', 'pesoKg', 'hba1c', 'imc'].forEach((field) => {
    if (body[field] !== undefined && body[field] !== '') {
      const n = parseFloat(body[field]);
      if (!isNaN(n)) payload[field] = n;
    }
  });

  // Configuración
  if (body.estatus && allowedEstatus.includes(body.estatus)) payload.estatus = body.estatus;
  if (body.riesgo && allowedRiesgo.includes(body.riesgo)) payload.riesgo = body.riesgo;

  // Asignación automática de Nutriólogo si aplica
  if (user && user.role === 'NUTRI') payload.nutriologoId = user.id;

  return { payload, errors };
}

// --- FUNCIONES DEL CONTROLADOR (Sin cambios mayores, solo usan la normalización nueva) ---

export const getAllPacientes = async (req, res) => {
  try {
    const whereClause = (req.user && req.user.role === 'NUTRI') ? { nutriologoId: req.user.id } : {};
    const pacientes = await Paciente.findAll({ where: whereClause });
    res.status(200).json(pacientes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pacientes', error: error.message });
  }
};

export const createPaciente = async (req, res) => {
  try {
    const { payload, errors } = normalizePacientePayload(req.body, req.user, false);
    if (errors.length) return res.status(400).json({ message: 'Error de validación', details: errors });

    const existing = await Paciente.findOne({ where: { curp: payload.curp } });
    if (existing) return res.status(409).json({ message: 'El CURP ya está registrado.' });

    const nuevoPaciente = await Paciente.create(payload);
    res.status(201).json(nuevoPaciente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear paciente', error: error.message });
  }
};

export const getPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Paciente.findByPk(id);
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });
    res.json(paciente);
  } catch (error) {
    res.status(500).json({ message: 'Error servidor', error: error.message });
  }
};

export const updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { payload } = normalizePacientePayload(req.body, req.user, true);
    
    const [updated] = await Paciente.update(payload, { where: { id } });
    if (!updated) return res.status(404).json({ message: 'No se pudo actualizar' });
    
    const paciente = await Paciente.findByPk(id);
    res.json(paciente);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar', error: error.message });
  }
};