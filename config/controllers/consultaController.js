// controllers/consultaController.js
import { Sequelize } from 'sequelize';
// Importamos el objeto db centralizado que tiene acceso a todos los modelos
import db from '../models/index.js'; 

// Extraemos los modelos necesarios para facilitar el código
const { Consulta, User, Paciente } = db; 

// --- OBTENER HISTORIAL CLÍNICO DE UN PACIENTE (Lista para la pestaña) ---
export const getConsultasByPacienteId = async (req, res) => {
    try {
        const { pacienteId } = req.params;

        // Regla de negocio: Asegurar que el paciente exista antes de buscar sus consultas
        const paciente = await Paciente.findByPk(pacienteId);
        if (!paciente) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }

        // Obtener el historial, incluyendo la información del Médico/Nutriólogo asociado (User)
        const consultas = await Consulta.findAll({
            where: { pacienteId },
            // Incluimos al Médico/Nutriólogo que realizó la consulta
            include: [{ 
                model: User, 
                as: 'Medico', // Usamos el alias 'Medico' definido en models/index.js
                attributes: ['id', 'nombre', 'email', 'role'] 
            }],
            // Ordenamos por fecha de consulta más reciente (Descendente)
            order: [['fechaConsulta', 'DESC']],
        });

        // Retorna la lista de consultas para la tabla del Historial Clínico (image_176ea0.png)
        res.status(200).json(consultas);
    } catch (error) {
        console.error('Error al obtener historial de consultas:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener historial.', error: error.message });
    }
};

// --- OBTENER DETALLE DE UNA CONSULTA ESPECÍFICA (Para el modal de Ver Detalle) ---
export const getConsultaById = async (req, res) => {
    try {
        const { id } = req.params; // id de la consulta

        const consulta = await Consulta.findByPk(id, {
            // Incluimos al médico para mostrar quién la realizó
            include: [{ model: User, as: 'Medico', attributes: ['id', 'nombre', 'email', 'role'] }],
        });

        if (!consulta) {
            return res.status(404).json({ message: 'Detalle de consulta no encontrado.' });
        }

        res.status(200).json(consulta); // Retorna los detalles para el modal (image_17716a.png)
    } catch (error) {
        console.error('Error al obtener detalle de consulta:', error);
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};

// --- REGISTRAR NUEVA CONSULTA (POST para el modal de Nueva Consulta) ---
export const createConsulta = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { motivo, hallazgos, tratamiento, pesoKg, hba1c, fechaConsulta } = req.body;
        
        // 1. Obtener el ID del Médico/Nutriólogo logueado del token (via authMiddleware)
        const medicoId = req.user.id; 
        
        // 2. Validación básica
        if (!motivo) {
            return res.status(400).json({ message: 'El motivo de la consulta es requerido.' });
        }

        // 3. Crear la nueva consulta
        const nuevaConsulta = await Consulta.create({
            pacienteId,
            medicoId,
            fechaConsulta: fechaConsulta || new Date(), // Usa la fecha proporcionada o la actual
            motivo,
            hallazgos,
            tratamiento,
            // Los campos numéricos opcionales se manejan con null si son undefined en el body
            pesoKg: pesoKg !== undefined && pesoKg !== '' ? parseFloat(pesoKg) : null,
            hba1c: hba1c !== undefined && hba1c !== '' ? parseFloat(hba1c) : null,
        });
        
        // 4. ACTUALIZAR EL CAMPO ultimaVisita del Paciente (Importante)
        await Paciente.update({ ultimaVisita: nuevaConsulta.fechaConsulta }, { where: { id: pacienteId } });
        
        // 5. Devolver la nueva consulta creada
        res.status(201).json(nuevaConsulta);

    } catch (error) {
        console.error('Error al crear nueva consulta:', error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             return res.status(400).json({ message: 'Error de relación: PacienteId o MedicoId no válidos.' });
        }
        res.status(500).json({ message: 'Error al registrar la consulta.', error: error.message });
    }
};

// NOTA: Se pueden añadir funciones de edición (updateConsulta) y eliminación (deleteConsulta) 
// si se requiere que el historial sea modificable.

// Exportamos todas las funciones
export {
  getConsultasByPacienteId,
  getConsultaById,
  createConsulta,
  // ... (otras funciones si existen, como updateConsulta)
};