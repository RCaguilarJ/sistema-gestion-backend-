import { Op } from 'sequelize';
import db from '../models/index.js'; 
import { sendCitaToAmd } from '../services/amdClient.js';

// Destructuramos el modelo necesario
const { Cita } = db;

// --- OBTENER CITAS DE UN PACIENTE ---
export const getCitasByPacienteId = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const now = new Date();
        const whereBase = { pacienteId };

        if (req.user && !['ADMIN'].includes(req.user.role)) {
            whereBase.medicoId = req.user.id;
        }
        
        const proximasCitas = await Cita.findAll({
            where: { 
                ...whereBase,
                fechaHora: { [Op.gte]: now },
                estado: { [Op.notIn]: ['Cancelada', 'Completada'] }
            },
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
        const { fechaHora, motivo, notas } = req.body; 

        if (!fechaHora || !motivo) {
            return res.status(400).json({ message: 'Los campos fechaHora y motivo son requeridos.' });
        }

                const nuevaCita = await Cita.create({
            pacienteId: parseInt(pacienteId), // Asegurar que sea entero
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

        const rolesPermitidos = ['DOCTOR', 'NUTRI', 'PSY', 'ENDOCRINOLOGO', 'PODOLOGO', 'PSICOLOGO'];
        if (!rolesPermitidos.includes(req.user.role)) {
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

        const [rowsAffected] = await Cita.update({ estado }, { where: { id } });

        if (rowsAffected === 0) {
            return res.status(404).json({ message: 'Cita no encontrada.' });
        }

                const updatedCita = await Cita.findByPk(id);

                sendCitaToAmd(updatedCita.toJSON())
                    .catch((syncError) => console.error('Error sincronizando estado cita AMD:', syncError.message));

        res.status(200).json(updatedCita);
    } catch (error) {
        console.error('Error al actualizar estado de cita:', error);
        res.status(500).json({ message: 'Error al actualizar la cita.', error: error.message });
    }
};

// ¡IMPORTANTE! He eliminado el bloque 'export { ... }' del final para evitar el error de duplicado.