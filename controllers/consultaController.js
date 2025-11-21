// controllers/consultaController.js
import { Consulta } from '../models/Consulta.js'; // Asegúrate de tener este modelo definido

/**
 * Obtiene todas las consultas de un paciente específico.
 * Ruta: GET /api/consultas/paciente/:pacienteId
 */
export const getConsultasByPacienteId = async (req, res) => {
  const { pacienteId } = req.params;

  try {
    const consultas = await Consulta.findAll({
      where: { pacienteId },
      order: [['fecha', 'DESC']],
    });

    res.json(consultas);
  } catch (error) {
    console.error(`Error al obtener consultas del paciente ${pacienteId}:`, error);
    res.status(500).json({ message: 'Error al obtener historial clínico.' });
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

    const nuevaConsulta = await Consulta.create({
      pacienteId,
      ...datosConsulta,
    });

    res.status(201).json(nuevaConsulta);
  } catch (error) {
    console.error(`Error al registrar consulta para el paciente ${pacienteId}:`, error);
    res.status(500).json({ message: 'Error al registrar nueva consulta.' });
  }
};

/**
 * Obtiene el detalle de una consulta específica.
 * Ruta: GET /api/consultas/:id
 */
export const getConsultaById = async (req, res) => {
  const { id } = req.params;

  try {
    const consulta = await Consulta.findByPk(id);

    if (!consulta) {
      return res.status(404).json({ message: 'Consulta no encontrada.' });
    }

    res.json(consulta);
  } catch (error) {
    console.error(`Error al obtener detalle de consulta ${id}:`, error);
    res.status(500).json({ message: 'Error al cargar detalle de consulta.' });
  }
};
