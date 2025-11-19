// controllers/pacienteController.js
import Paciente from '../models/Paciente.js';
import { Sequelize } from 'sequelize'; // Para manejar errores de Sequelize (UniqueConstraintError)

// Helper: normalize and validate incoming paciente payloads
const allowedGeneros = ['Masculino', 'Femenino', 'Otro'];
const allowedTipoDiabetes = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Otro'];
const allowedEstatus = ['Activo', 'Inactivo'];
const allowedRiesgo = ['Alto', 'Medio', 'Bajo'];

// Esta función es vital para limpiar los datos antes de enviarlos a Sequelize.
function normalizePacientePayload(body = {}, user = null, isUpdate = false) {
  const payload = {};
  const errors = [];

  // Nombre
  const nombreRaw = body.nombre || body.nombreCompleto || body.name || body.nombre_paciente;
  const nombre = nombreRaw !== undefined ? String(nombreRaw).trim() : '';
  if (nombre) payload.nombre = nombre;
  else if (!isUpdate) errors.push('Campo requerido: nombre'); // Requerido solo en creación

  // CURP (required) - Solo permitimos actualizar si viene explícitamente.
  const curpRaw = body.curp;
  const curp = curpRaw !== undefined ? String(curpRaw).trim() : '';
  if (curp) payload.curp = curp;
  else if (!isUpdate) errors.push('Campo requerido: curp');

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

  // Contacto y Domicilio: se copian si existen y no son nulos/vacíos
  ['telefono', 'email', 'calleNumero', 'colonia', 'municipio', 'estado', 'codigoPostal', 'programa', 'tipoTerapia'].forEach((f) => {
    // Solo procesar si el campo fue enviado
    if (body[f] !== undefined) {
        const value = String(body[f] || '').trim();
        // Solo establecer si tiene un valor después de trim, o si se está borrando (vacío permitido en update)
        if (value.length > 0 || isUpdate) {
            if (f === 'email' && value.length > 0) {
                const emailRegex = /^\S+@\S+\.\S+$/;
                if (emailRegex.test(value)) payload.email = value;
                else errors.push('email inválido');
            } else {
                payload[f] = value.length > 0 ? value : null; // Guardar como NULL si es cadena vacía en update
            }
        }
    }
  });

  // Tipo de diabetes (enum)
  if (body.tipoDiabetes) {
    const t = String(body.tipoDiabetes).trim();
    const match = allowedTipoDiabetes.find(x => x.toLowerCase() === t.toLowerCase());
    if (match) payload.tipoDiabetes = match;
    else errors.push('tipoDiabetes inválido');
  }

  // Números: estatura, peso, hba1c, imc (Corrección: deben ser números válidos o eliminados)
  ['estaturaCm', 'pesoKg', 'hba1c', 'imc'].forEach((f) => {
    if (body[f] !== undefined && body[f] !== '') {
        const n = parseFloat(body[f]);
        if (!isNaN(n)) {
            // Sequelize manejará la conversión a INTEGER/DECIMAL
            payload[f] = n; 
        } else {
            errors.push(`${f} inválido: debe ser un número.`);
        }
    } else if (isUpdate && body[f] === '') {
        payload[f] = null; // Permite borrar el valor
    }
  });


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

  // nutriologoId: si el usuario es NUTRI, sobrescribe; si no, acepta el numeric si se provee
  if (user && user.role === 'NUTRI') payload.nutriologoId = user.id;
  else if (body.nutriologoId !== undefined) {
    const n = parseInt(body.nutriologoId, 10);
    if (!isNaN(n)) payload.nutriologoId = n;
  }
  // Si es update y se envía como vacío (ej. para desasignar)
  else if (isUpdate && body.nutriologoId === '') {
      payload.nutriologoId = null; 
  }

  return { payload, errors };
}

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
    res.status(200).json(pacientes);

  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pacientes', error: error.message });
  }
};

// --- CREAR UN NUEVO PACIENTE ---
export const createPaciente = async (req, res) => {
  try {
    // El último argumento (false) indica que no es una actualización
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

// --- NUEVA FUNCIÓN: OBTENER UN PACIENTE POR ID ---
export const getPaciente = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Implementa la lógica de filtro por nutriologoId si el usuario es NUTRI
      let whereClause = { id };
      if (req.user && req.user.role === 'NUTRI') {
          whereClause = { id, nutriologoId: req.user.id };
      }

      const paciente = await Paciente.findOne({ where: whereClause });

      if (!paciente) {
        // Devuelve 404 si el paciente no existe o no pertenece al NUTRI
        return res.status(404).json({ message: 'Paciente no encontrado o acceso denegado.' }); 
      }

      res.status(200).json(paciente);
      
    } catch (error) {
      console.error('Error al obtener paciente por ID:', error);
      res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};

// --- NUEVA FUNCIÓN: ACTUALIZAR UN PACIENTE POR ID ---
export const updatePaciente = async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Validar y limpiar el payload (isUpdate = true)
      const { payload, errors } = normalizePacientePayload(req.body, req.user, true); 
      if (errors.length) {
        return res.status(400).json({ message: 'Validation error', details: errors });
      }

      // 2. Encontrar el paciente (aplicar filtro de seguridad para NUTRI)
      let whereClause = { id };
      if (req.user && req.user.role === 'NUTRI') {
          // Solo pueden actualizar sus pacientes asignados
          whereClause = { id, nutriologoId: req.user.id }; 
      }
      
      const paciente = await Paciente.findOne({ where: whereClause });

      if (!paciente) {
        return res.status(404).json({ message: 'Paciente no encontrado para actualizar o acceso denegado.' });
      }

      // 3. Actualizar
      const [rowsAffected, [updatedPaciente]] = await Paciente.update(payload, { 
          where: { id },
          returning: true, // Necesario para obtener el objeto actualizado en algunos dialectos (como PostgreSQL)
      });
      
      // Para MySQL, es más seguro buscar el paciente de nuevo ya que 'updatedPaciente' podría ser [].
      const freshPaciente = await Paciente.findByPk(id);

      if (rowsAffected === 0) {
          // Esto puede pasar si el paciente existe pero no hubo campos que actualizar
          return res.status(200).json(freshPaciente); 
      }

      res.status(200).json(freshPaciente); // Retorna el paciente actualizado

    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
          // Muestra un error específico si intenta usar un CURP o Email ya existente
          const details = error.errors.map((e) => e.message);
          return res.status(409).json({ message: 'Constraint error', details });
      }
      
      res.status(500).json({ message: 'Error interno del servidor al actualizar el paciente.', error: error.message });
    }
};

// ... (exportamos las funciones)