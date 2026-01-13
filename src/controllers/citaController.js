import { Op } from 'sequelize';
import db from '../models/index.js'; 
import { sendCitaToAmd } from '../services/amdClient.js';
import { ADMIN_ROLES, MEDICAL_ROLES, isAdmin } from '../constants/roles.js';

// Destructuramos los modelos que necesitamos
const { Cita, User } = db;

// --- OBTENER CITAS DE UN PACIENTE ---
export const getCitasByPacienteId = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const now = new Date();
        const whereBase = { pacienteId };

        if (req.user && !isAdmin(req.user.role)) {
            whereBase.medicoId = req.user.id;
        }
        
        const proximasCitas = await Cita.findAll({
            where: { 
                ...whereBase,
                fechaHora: { [Op.gte]: now },
                estado: { [Op.notIn]: ['Cancelada', 'Completada'] }
            },
            include: [{ model: User, as: 'Medico', attributes: ['nombre', 'email'] }],
            order: [['fechaHora', 'ASC']],
        });

        const historialCitas = await Cita.findAll({
            where: { 
                ...whereBase,
                [Op.or]: [
                    { fechaHora: { [Op.lt]: now } },
                    { estado: { [Op.in]: ['Cancelada', 'Completada'] } }
                ]
            },
            include: [{ model: User, as: 'Medico', attributes: ['nombre', 'email'] }],
            order: [['fechaHora', 'DESC']],
        });

        res.status(200).json({ proximasCitas, historialCitas });
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener citas.', error: error.message });
    }
};

// --- AGENDAR NUEVA CITA (POST) ---
export const createCita = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { fechaHora, motivo, medicoId, notas } = req.body; 

        if (!fechaHora || !motivo || !medicoId) {
            return res.status(400).json({ message: 'Los campos fechaHora, motivo y medicoId son requeridos.' });
        }

                const nuevaCita = await Cita.create({
            pacienteId: parseInt(pacienteId), // Asegurar que sea entero
            medicoId: parseInt(medicoId),     // Asegurar que sea entero
            fechaHora: new Date(fechaHora),
            motivo,
            notas,
            estado: 'Pendiente', 
        });

                sendCitaToAmd(nuevaCita.toJSON())
                    .catch((syncError) => console.error('Error sincronizando cita con AMD:', syncError.message));

        res.status(201).json(nuevaCita);
    } catch (error) {
        console.error('Error al crear nueva cita:', error);
        res.status(500).json({ message: 'Error al agendar la cita.', error: error.message });
    }
};

export const getPendingCitasForMedico = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'No autenticado.' });
        }

        if (!MEDICAL_ROLES.includes(req.user.role)) {
            return res.status(403).json({ message: 'Rol sin acceso a pendientes.' });
        }

        const now = new Date();
        const citas = await Cita.findAll({
            where: {
                medicoId: req.user.id,
                estado: { [Op.in]: ['Pendiente', 'Confirmada'] },
                fechaHora: { [Op.gte]: now }
            },
            order: [['fechaHora', 'ASC']]
        });

        res.json(citas);
    } catch (error) {
        console.error('Error obteniendo pendientes médico:', error);
        res.status(500).json({ message: 'Error al obtener pendientes', error: error.message });
    }
};

// --- ACTUALIZAR ESTADO DE CITA (PUT) ---
export const updateCitaEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!['Confirmada', 'Cancelada', 'Completada'].includes(estado)) {
            return res.status(400).json({ message: 'Estado de cita no válido.' });
        }

        // Buscar cita con relaciones incluidas
        const cita = await Cita.findByPk(id, {
            include: [
                { model: User, as: 'Paciente', attributes: ['nombre', 'email'] },
                { model: User, as: 'Medico', attributes: ['nombre', 'email', 'role'] }
            ]
        });
        
        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada.' });
        }

        // Solo el médico asignado o ADMIN pueden cambiar el estado
        const esAdmin = isAdmin(req.user.role);
        const esMedicoAsignado = cita.medicoId === req.user.id;

        if (!esAdmin && !esMedicoAsignado) {
            // NOTA: Devuelve detalles para debugging según requerimientos
            // En producción, considerar logging server-side con mensaje genérico al cliente
            return res.status(403).json({ 
                message: 'No tienes permiso para modificar esta cita.',
                detalles: {
                    medicoAsignado: cita.medicoId,
                    usuarioActual: req.user.id,
                    rolUsuario: req.user.role
                }
            });
        }

        // Actualizar el estado directamente en la instancia
        cita.estado = estado;
        await cita.save();

        sendCitaToAmd(cita.toJSON())
            .catch((syncError) => console.error('Error sincronizando estado cita AMD:', syncError.message));

        res.status(200).json({
            success: true,
            cita: cita,
            message: `Estado actualizado a: ${estado}`
        });
    } catch (error) {
        console.error('Error al actualizar estado de cita:', error);
        res.status(500).json({ message: 'Error al actualizar la cita.', error: error.message });
    }
};

// NUEVO: Obtener TODAS las citas del médico logueado
export const getMisCitas = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    if (!MEDICAL_ROLES.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Solo médicos y especialistas pueden ver sus citas.' 
      });
    }

    const citas = await Cita.findAll({
      where: { medicoId: req.user.id },
      include: [
        { 
          model: User, 
          as: 'Paciente', 
          attributes: ['id', 'nombre', 'email'] 
        }
      ],
      order: [['fechaHora', 'DESC']]
    });

    res.json({ 
      success: true, 
      citas,
      total: citas.length,
      medicoId: req.user.id,
      medicoNombre: req.user.nombre
    });
  } catch (error) {
    console.error('Error obteniendo mis citas:', error);
    res.status(500).json({ 
      message: 'Error al obtener citas', 
      error: error.message 
    });
  }
};

// NUEVO: Obtener TODAS las citas del sistema (solo ADMIN)
export const getAllCitas = async (req, res) => {
  try {
    const citas = await Cita.findAll({
      include: [
        { 
          model: User, 
          as: 'Paciente', 
          attributes: ['id', 'nombre', 'email'] 
        },
        { 
          model: User, 
          as: 'Medico', 
          attributes: ['id', 'nombre', 'email', 'role'] 
        }
      ],
      order: [['fechaHora', 'DESC']]
    });

    res.json({ 
      success: true, 
      citas,
      total: citas.length
    });
  } catch (error) {
    console.error('Error obteniendo todas las citas:', error);
    res.status(500).json({ 
      message: 'Error al obtener citas', 
      error: error.message 
    });
  }
};

// ¡IMPORTANTE! He eliminado el bloque 'export { ... }' del final para evitar el error de duplicado.