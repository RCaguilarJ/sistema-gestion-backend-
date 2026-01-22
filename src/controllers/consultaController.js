// src/controllers/consultaController.js
import db from '../models/index.js'; // Importamos desde el indice de modelos
const { Consulta } = db; // Destructuramos el modelo Consulta

const toTrimmedString = (value) => {
  if (value === null || value === undefined) return null;
  const text = value.toString().trim();
  return text.length > 0 ? text : null;
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const cleaned = value.toString().replace(',', '.').replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  const text = value.toString().trim();
  if (!text) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split('/');
    return new Date(`${year}-${month}-${day}`);
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildConsultaPayload = (raw, pacienteId) => {
  const motivo = toTrimmedString(raw.motivo ?? raw.motivoConsulta);
  const hallazgos = toTrimmedString(raw.hallazgos ?? raw.findings);
  const tratamiento = toTrimmedString(raw.tratamiento ?? raw.treatment);
  const pesoKg = parseNumber(raw.pesoKg ?? raw.peso ?? raw.peso_kg);
  const hba1c = parseNumber(raw.hba1c ?? raw.hba1cPercent ?? raw.hba1cValue);
  const fechaConsulta = parseDate(raw.fechaConsulta ?? raw.fecha ?? raw.fecha_consulta);

  return {
    motivo,
    hallazgos,
    tratamiento,
    pesoKg,
    hba1c,
    fechaConsulta,
    pacienteId,
  };
};
/**
 * Obtiene todas las consultas (solo admin).
 * Ruta: GET /api/consultas
 */
export const getAllConsultas = async (req, res) => {
  try {
    const consultas = await Consulta.findAll({
      order: [['fechaConsulta', 'DESC']],
    });

    res.json(consultas);
  } catch (error) {
    console.error("Error al obtener consultas:", error);
    res.status(500).json({ message: "Error al obtener consultas.", error: error.message });
  }
};
/**
 * Obtiene todas las consultas de un paciente específico.
 * Ruta: GET /api/consultas/paciente/:pacienteId
 */
export const getConsultasByPacienteId = async (req, res) => {
  const { pacienteId } = req.params;
  const pacienteIdNumber = Number(pacienteId);

  try {
    if (!Number.isFinite(pacienteIdNumber) || pacienteIdNumber <= 0) {
      return res.status(400).json({ message: 'pacienteId invalido.' });
    }

    const consultas = await Consulta.findAll({
      where: { pacienteId: pacienteIdNumber },
      order: [['fechaConsulta', 'DESC']], // Corregido para usar el nombre correcto del campo en BD
    });

    res.json(consultas);
  } catch (error) {
    console.error(`Error al obtener consultas del paciente ${pacienteId}:`, error);
    res.status(500).json({ message: 'Error al obtener historial clínico.', error: error.message });
  }
};

/**
 * Registra una nueva consulta para un paciente.
 * Ruta: POST /api/consultas/paciente/:pacienteId
 */
export const createConsulta = async (req, res) => {
  const { pacienteId } = req.params;
  const pacienteIdNumber = Number(pacienteId);
  const datosConsulta = req.body || {};

  try {
    if (!Number.isFinite(pacienteIdNumber) || pacienteIdNumber <= 0) {
      return res.status(400).json({ message: 'pacienteId invalido.' });
    }

    const payload = buildConsultaPayload(datosConsulta, pacienteIdNumber);
    if (!payload.motivo) {
      return res.status(400).json({ message: 'motivo es requerido.' });
    }
    if (!payload.fechaConsulta) {
      return res.status(400).json({ message: 'fechaConsulta es requerida.' });
    }

    const nuevaConsulta = await Consulta.create(payload);

    const paciente = await db.Paciente.findByPk(pacienteIdNumber);
    if (paciente) {
      const updates = {};
      if (payload.hba1c !== null) updates.hba1c = payload.hba1c;
      if (payload.pesoKg !== null) updates.pesoKg = payload.pesoKg;
      if (payload.fechaConsulta) updates.ultimaVisita = payload.fechaConsulta;

      if (payload.pesoKg !== null) {
        const estatura = Number(paciente.estatura);
        if (Number.isFinite(estatura) && estatura > 0) {
          updates.imc = Number((payload.pesoKg / (estatura * estatura)).toFixed(1));
        }
      }

      if (Object.keys(updates).length > 0) {
        await paciente.update(updates);
      }
    }

    res.status(201).json(nuevaConsulta);
  } catch (error) {
    console.error(`Error al registrar consulta para el paciente ${pacienteId}:`, error);
    res.status(500).json({ message: 'Error al registrar nueva consulta.', error: error.message });
  }
};
/**
 * Obtiene el detalle de una consulta específica.
 * Ruta: GET /api/consultas/:id
 */
export const getConsultaById = async (req, res) => {
  const { id } = req.params;

  try {
    const consulta = await Consulta.findByPk(id, {
      // Incluir datos del médico si es necesario, asumiendo que tienes la relación definida
      // include: [{ model: db.User, as: 'Medico' }] 
    });

    if (!consulta) {
      return res.status(404).json({ message: 'Consulta no encontrada.' });
    }

    res.json(consulta);
  } catch (error) {
    console.error(`Error al obtener detalle de consulta ${id}:`, error);
    res.status(500).json({ message: 'Error al cargar detalle de consulta.', error: error.message });
  }
};



