// controllers/pacienteController.js
import Paciente from '../models/Paciente.js';
import { Sequelize } from 'sequelize';
import db from '../models/index.js'; // Importamos el objeto db centralizado

const { User } = db; // Para obtener datos del usuario asignado

// Definiciones de ENUMS (para reusar en validación)
const allowedGeneros = ['Masculino', 'Femenino', 'Otro'];
const allowedTipoDiabetes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Otro'];
const allowedEstatus = ['Activo', 'Inactivo'];
const allowedRiesgo = ['Alto', 'Medio', 'Bajo'];

// Helper: normaliza y valida datos. 
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
  } else if (isUpdate && body.fechaNacimiento === '') {
      payload.fechaNacimiento = null;
  }

  // Cadenas y ENUMs
  ['genero', 'telefono', 'email', 'calleNumero', 'colonia', 'municipio', 'estado', 'codigoPostal', 
   'tipoDiabetes', 'fechaDiagnostico', 'programa', 'tipoTerapia', 'estatus', 'riesgo', 'ultimaVisita']
   .forEach((f) => {
    if (body[f] !== undefined) {
        const value = String(body[f] || '').trim();
        if (value.length > 0) {
            payload[f] = value;
            if (f === 'email') {
                const emailRegex = /^\S+@\S+\.\S+$/;
                if (!emailRegex.test(value)) errors.push('email inválido');
            }
        } else if (isUpdate) {
            payload[f] = null;
        }
    }
  });

  // Manejo de Números (Limpia cadenas vacías y verifica que sean números)
  ['estaturaCm', 'pesoKg', 'hba1c', 'imc'].forEach((f) => {
    if (body[f] !== undefined) {
      if (body[f] === '' && isUpdate) {
        payload[f] = null;
      } else {
        const n = parseFloat(body[f]);
        if (!isNaN(n)) {
          payload[f] = n; 
        } else if (body[f] !== '') {
          errors.push(`${f} inválido: debe ser un número.`);
        }
      }
    }
  });
  
  // Asignación de nutriologoId
  if (user && user.role === 'NUTRI') payload.nutriologoId = user.id;
  else if (body.nutriologoId !== undefined) {
    const n = parseInt(body.nutriologoId, 10);
    if (!isNaN(n)) payload.nutriologoId = n;
    else if (isUpdate && body.nutriologoId === '') payload.nutriologoId = null;
  }

  return { payload, errors };
}


// --- OBTENER TODOS LOS PACIENTES ---
export const getAllPacientes = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user && req.user.role === 'NUTRI') {
      whereClause = { nutriologoId: req.user.id };
    }
    
    const pacientes = await Paciente.findAll({ 
        where: whereClause,
        include: [{ model: User, as: 'Nutriologo', attributes: ['id', 'nombre'] }]
    });
    res.status(200).json(pacientes);

  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pacientes', error: error.message });
  }
};


// --- CREAR UN NUEVO PACIENTE ---
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

    if (error.name === 'SequelizeUniqueConstraintError') {
      const details = error.errors.map((e) => e.message);
      return res.status(409).json({ message: 'Constraint error', details });
    }

    res.status(500).json({ message: 'Error al crear el paciente', error: error.message });
  }
};


// --- OBTENER UN PACIENTE POR ID (IMPLEMENTACIÓN DE LA RUTA DINÁMICA) ---
export const getPaciente = async (req, res) => {
    try {
      const { id } = req.params; // Captura el ID de la URL
      
      let whereClause = { id };
      if (req.user && req.user.role === 'NUTRI') {
          whereClause = { id, nutriologoId: req.user.id };
      }

      // Buscamos el paciente por ID
      const paciente = await Paciente.findOne({ 
          where: whereClause,
          include: [{ model: User, as: 'Nutriologo', attributes: ['id', 'nombre'] }]
      });

      if (!paciente) {
        // Devolvemos un 404 con JSON (Express's default 404 is HTML)
        return res.status(404).json({ message: 'Paciente no encontrado o acceso denegado.' }); 
      }

      // Devolvemos el paciente encontrado
      res.status(200).json(paciente);
      
    } catch (error) {
      console.error('Error al obtener paciente por ID:', error);
      res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};

// --- ACTUALIZAR UN PACIENTE POR ID (EDIT) ---
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
      
      const [rowsAffected] = await Paciente.update(payload, { 
          where: whereClause,
      });

      if (rowsAffected === 0) {
          const pacienteExists = await Paciente.findByPk(id);
          if (!pacienteExists) {
               return res.status(404).json({ message: 'Paciente no encontrado para actualizar.' });
          }
      }
      
      const updatedPaciente = await Paciente.findByPk(id, {
          include: [{ model: User, as: 'Nutriologo', attributes: ['id', 'nombre'] }]
      });

      res.status(200).json(updatedPaciente);

    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
          const details = error.errors.map((e) => e.message);
          return res.status(409).json({ message: 'Constraint error: El CURP o Email ya están registrados.', details });
      }
      
      res.status(500).json({ message: 'Error interno del servidor al actualizar el paciente.' });
    }
};

// --- EXPORTACIÓN FINAL ---
