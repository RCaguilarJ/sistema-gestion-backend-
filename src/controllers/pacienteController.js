import Paciente from '../models/Paciente.js';
import { sendPacienteToAmd } from '../services/amdClient.js';
import db from '../models/index.js';
import { Op } from 'sequelize';
import { MEDICAL_ROLES } from '../constants/roles.js';

// Listas de valores permitidos para validación
const allowedGeneros = ['Masculino', 'Femenino', 'Otro'];
const allowedEstatus = ['Activo', 'Inactivo'];
const allowedRiesgo = ['Alto', 'Medio', 'Bajo'];
const allowedTipoDiabetes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Otro'];

/**
 * Función auxiliar para limpiar, validar y normalizar los datos que llegan del frontend.
 * @param {Object} body - El cuerpo de la petición (req.body)
 * @param {Object} user - El usuario autenticado (req.user)
 * @param {Boolean} isUpdate - Indica si es una actualización (para validaciones más flexibles)
 */
function normalizePacientePayload(body = {}, user = null, isUpdate = false) {
  const payload = {};
  const errors = [];

  // --- 1. Datos Personales ---
  // Nombre
  const nombre = body.nombre ? String(body.nombre).trim() : '';
  if (nombre) payload.nombre = nombre;
  else if (!isUpdate) errors.push('Campo requerido: Nombre');

  // CURP
  const curp = body.curp ? String(body.curp).trim() : '';
  if (curp) payload.curp = curp;
  else if (!isUpdate) errors.push('Campo requerido: CURP');

  // Fecha Nacimiento
  if (body.fechaNacimiento) payload.fechaNacimiento = body.fechaNacimiento;
  
  // Género
  if (body.genero) {
    const g = String(body.genero).trim();
    // Buscamos coincidencia exacta o case-insensitive
    const match = allowedGeneros.find(x => x.toLowerCase() === g.toLowerCase());
    if (match) payload.genero = match;
  }

  // --- 2. Contacto y Domicilio ---
  const contactFields = [
    'telefono', 'celular', 'email', 
    'calleNumero', 'colonia', 'municipio', 'estado', 'codigoPostal'
  ];
  
  contactFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  // --- 3. Programa y Servicio (Nuevos Campos) ---
  const programFields = [
    'grupo', 'tipoServicio', 'tipoTerapia', 'responsable', 'motivoConsulta'
  ];

  programFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  // --- 4. Fechas y Datos Clínicos ---
  if (body.mesEstadistico) payload.mesEstadistico = body.mesEstadistico;
  if (body.fechaDiagnostico) payload.fechaDiagnostico = body.fechaDiagnostico;
  
  if (body.tipoDiabetes) {
    const t = String(body.tipoDiabetes).trim();
    const match = allowedTipoDiabetes.find(x => x.toLowerCase() === t.toLowerCase());
    if (match) payload.tipoDiabetes = match;
  }

  // Booleano "Primera Vez"
  if (body.primeraVez !== undefined) {
    payload.primeraVez = Boolean(body.primeraVez);
  }

  // --- 5. Datos Numéricos (Decimales y Enteros) ---
  // Estatura ahora es decimal (metros), igual que peso, hba1c e imc
  ['estatura', 'pesoKg', 'hba1c', 'imc'].forEach((field) => {
    if (body[field] !== undefined && body[field] !== '') {
      const n = parseFloat(body[field]);
      if (!isNaN(n)) payload[field] = n;
      // Si no es un número válido, podríamos agregar error o ignorarlo.
      // Aquí lo ignoramos si viene basura, pero si es requerido, agregamos validación.
    }
  });

  // --- 6. Configuración Interna ---
  if (body.estatus) {
    const e = String(body.estatus).trim();
    const match = allowedEstatus.find(x => x.toLowerCase() === e.toLowerCase());
    if (match) payload.estatus = match;
  }
  
  if (body.riesgo) {
    const r = String(body.riesgo).trim();
    const match = allowedRiesgo.find(x => x.toLowerCase() === r.toLowerCase());
    if (match) payload.riesgo = match;
  }

  // Asignación automática de Nutriólogo si el usuario logueado tiene ese rol
  if (user && user.role === 'NUTRI') {
    payload.nutriologoId = user.id;
  } else if (body.nutriologoId) {
    // Si es ADMIN, puede asignar manualmente si envía el ID
    payload.nutriologoId = parseInt(body.nutriologoId, 10);
  }

  return { payload, errors };
}

// --- CONTROLADORES EXPORTADOS ---

/**
 * Obtener todos los pacientes.
 * - ADMIN/SUPER_ADMIN: ven TODOS los pacientes (sin filtros)
 * - NUTRI: solo ve pacientes asignados por nutriologoId
 * - Especialistas médicos (ENDOCRINOLOGO, PSICOLOGO, DOCTOR, etc.): solo ven pacientes con citas
 */
export const getAllPacientes = async (req, res) => {
  try {
    const whereClause = {};
    const { Cita } = db;
    
    // ADMIN y SUPER_ADMIN: ven todos los pacientes sin filtros
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
      // No aplicar filtros - verán todos los pacientes
    }
    // Filtro por rol: Nutriólogo solo ve sus pacientes asignados
    else if (req.user && req.user.role === 'NUTRI') {
      whereClause.nutriologoId = req.user.id;
    }
    // Filtro para especialistas médicos: solo ven pacientes con citas
    else if (req.user && MEDICAL_ROLES.includes(req.user.role)) {
      const citasPacientes = await Cita.findAll({
        where: { medicoId: req.user.id },
        attributes: ['pacienteId'],
        raw: true
      });
      const pacienteIds = [...new Set(citasPacientes.map(c => c.pacienteId))];
      
      if (pacienteIds.length > 0) {
        whereClause.id = { [Op.in]: pacienteIds };
      } else {
        // Si el especialista no tiene citas aún, filtrar para que no retorne nada
        whereClause.id = { [Op.in]: [] };
      }
    }

    const pacientes = await Paciente.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']] // Los más nuevos primero
    });
    
    res.status(200).json(pacientes);
  } catch (error) {
    console.error("Error getAllPacientes:", error);
    res.status(500).json({ message: 'Error al obtener pacientes', error: error.message });
  }
};

/**
 * Crear un nuevo paciente.
 */
export const createPaciente = async (req, res) => {
  try {
    const { payload, errors } = normalizePacientePayload(req.body, req.user, false);
    
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Error de validación', details: errors });
    }

    // Verificar duplicados por CURP
    const existing = await Paciente.findOne({ where: { curp: payload.curp } });
    if (existing) {
      return res.status(409).json({ message: 'El CURP ya está registrado en el sistema.' });
    }

    const nuevoPaciente = await Paciente.create(payload);

    sendPacienteToAmd(nuevoPaciente.toJSON())
      .catch((syncError) => console.error('Error sincronizando paciente con AMD:', syncError.message));

    res.status(201).json(nuevoPaciente);
  } catch (error) {
    console.error("Error createPaciente:", error);
    
    // Manejo de errores específicos de Sequelize
    if (error.name === 'SequelizeUniqueConstraintError') {
       return res.status(409).json({ message: 'El CURP ya existe.' });
    }

    res.status(500).json({ message: 'Error al crear paciente', error: error.message });
  }
};

/**
 * Obtener un paciente por ID.
 */
export const getPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Construir cláusula WHERE
    const whereClause = { id };
    if (req.user && req.user.role === 'NUTRI') {
      whereClause.nutriologoId = req.user.id;
    }

    const paciente = await Paciente.findOne({ where: whereClause });
    
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado o acceso denegado.' });
    }

    res.json(paciente);
  } catch (error) {
    console.error("Error getPaciente:", error);
    res.status(500).json({ message: 'Error servidor', error: error.message });
  }
};

/**
 * Actualizar un paciente existente.
 */
export const updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { payload, errors } = normalizePacientePayload(req.body, req.user, true);

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Error de validación', details: errors });
    }
    
    // Verificar permisos y existencia
    const whereClause = { id };
    if (req.user && req.user.role === 'NUTRI') {
      whereClause.nutriologoId = req.user.id;
    }

    const paciente = await Paciente.findOne({ where: whereClause });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado para actualizar.' });
    }

    // Verificar unicidad de CURP si se está cambiando
    if (payload.curp && payload.curp !== paciente.curp) {
        const curpOwner = await Paciente.findOne({ where: { curp: payload.curp } });
        if (curpOwner) {
            return res.status(409).json({ message: 'El CURP ya pertenece a otro paciente.' });
        }
    }

    await paciente.update(payload);

    sendPacienteToAmd(paciente.toJSON())
      .catch((syncError) => console.error('Error sincronizando actualización AMD:', syncError.message));
    
    // Devolver el objeto actualizado
    res.json(paciente);
  } catch (error) {
    console.error("Error updatePaciente:", error);
    res.status(500).json({ message: 'Error al actualizar', error: error.message });
  }
};

export { normalizePacientePayload };