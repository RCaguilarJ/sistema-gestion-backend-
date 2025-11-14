// controllers/pacienteController.js
import Paciente from '../models/Paciente.js';

// --- OBTENER TODOS LOS PACIENTES ---
export const getAllPacientes = async (req, res) => {
  try {
    // 1. Pide a Sequelize todos los registros de la tabla 'Pacientes'
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
    const nuevoPaciente = await Paciente.create(req.body);
    res.status(201).json(nuevoPaciente);
  } catch (error) {
    // (Manejo de error simple, se puede mejorar para errores de validación)
    res.status(400).json({ message: 'Error al crear el paciente', error: error.message });
  }
};

// (Aquí pondremos getPacienteById, updatePaciente, etc. después)