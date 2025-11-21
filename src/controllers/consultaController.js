// src/controllers/consultaController.js
import db from '../models/index.js'; // Importamos desde el índice de modelos
const { Consulta } = db; // Destructuramos el modelo Consulta

/**
 * Obtiene todas las consultas de un paciente específico.
 * Ruta: GET /api/consultas/paciente/:pacienteId
 */
export const getConsultasByPacienteId = async (req, res) => {
  const { pacienteId } = req.params;

  try {
    const consultas = await Consulta.findAll({
      where: { pacienteId },
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
  const datosConsulta = req.body;

  try {
    if (!datosConsulta || Object.keys(datosConsulta).length === 0) {
      return res.status(400).json({ message: 'Datos de consulta vacíos o mal formateados.' });
    }

    // Aseguramos que el pacienteId venga en el cuerpo o lo forzamos desde la URL
    const nuevaConsulta = await Consulta.create({
      ...datosConsulta,
      pacienteId: parseInt(pacienteId), // Asegurar que sea entero
    });

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