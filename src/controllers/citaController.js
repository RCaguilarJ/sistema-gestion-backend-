import { Op } from 'sequelize';
import db from '../models/index.js'; 
import { sendCitaToAmd } from '../services/amdClient.js';

// Destructuramos los modelos que necesitamos
const { Cita, User, Paciente } = db;

// Constantes para roles
const ROLES_ADMIN = ['ADMIN', 'SUPER_ADMIN'];
const ROLES_MEDICOS = ['DOCTOR', 'NUTRI', 'ENDOCRINOLOGO', 'ENDOCRINO', 'PODOLOGO', 'PSICOLOGO'];

// --- OBTENER CITAS DE UN PACIENTE ---
export const getCitasByPacienteId = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const now = new Date();
        const whereBase = { pacienteId: parseInt(pacienteId) };

        // Si el usuario es un médico (no ADMIN), solo ver SUS citas
        if (req.user) {
            if (!ROLES_ADMIN.includes(req.user.role)) {
                whereBase.medicoId = req.user.id;
                console.log(`Médico ${req.user.id} consultando citas del paciente ${pacienteId}`);
            } else {
                console.log(`Admin consultando todas las citas del paciente ${pacienteId}`);
            }
        }
        
        const proximasCitas = await Cita.findAll({
            where: { 
                ...whereBase,
                fechaHora: { [Op.gte]: now },
                estado: { [Op.notIn]: ['Cancelada', 'Completada'] }
            },
            include: [{ model: User, as: 'Medico', attributes: ['nombre', 'email', 'role'] }],
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
            include: [{ model: User, as: 'Medico', attributes: ['nombre', 'email', 'role'] }],
            order: [['fechaHora', 'DESC']],
        });

        res.status(200).json({ 
            success: true,
            proximasCitas, 
            historialCitas,
            filtrado: !ROLES_ADMIN.includes(req.user?.role) ? 'Por médico' : 'Todas'
        });
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener citas.', error: error.message });
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

        if (!ROLES_MEDICOS.includes(req.user.role)) {
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

// --- VER TODAS LAS CITAS DEL MÉDICO (pasadas y futuras) ---
export const getMisCitas = async (req, res) => {
  try {
    const usuarioLogueado = req.user;
    
    // Validar que sea un médico/especialista
    if (!ROLES_MEDICOS.includes(usuarioLogueado.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo médicos pueden acceder a este endpoint' 
      });
    }
    
    // FILTRO CRÍTICO: Solo citas donde medicoId = usuario logueado
    const citas = await Cita.findAll({
      where: { medicoId: usuarioLogueado.id },
      include: [
        { 
          model: Paciente, 
          as: 'paciente',
          attributes: ['id', 'nombre', 'email', 'telefono', 'curp']
        }
      ],
      order: [['fechaHora', 'DESC']]
    });
    
    res.json({ 
      success: true, 
      citas,
      total: citas.length,
      medico: {
        id: usuarioLogueado.id,
        nombre: usuarioLogueado.nombre,
        role: usuarioLogueado.role
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo citas del médico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener citas', 
      error: error.message 
    });
  }
};

// --- VER TODAS LAS CITAS DEL SISTEMA (Solo ADMIN) ---
export const getTodasLasCitas = async (req, res) => {
  try {
    const usuarioLogueado = req.user;
    
    // Solo ADMIN puede ver todas las citas
    if (!ROLES_ADMIN.includes(usuarioLogueado.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo administradores pueden ver todas las citas' 
      });
    }
    
    // Sin filtro de medicoId - obtener TODAS las citas
    const citas = await Cita.findAll({
      include: [
        { 
          model: Paciente, 
          as: 'paciente',
          attributes: ['id', 'nombre', 'email', 'telefono', 'curp']
        },
        { 
          model: User, 
          as: 'Medico',
          attributes: ['id', 'nombre', 'email', 'role']
        }
      ],
      order: [['fechaHora', 'DESC']]
    });
    
    // Agrupar por médico para estadísticas
    const citasPorMedico = {};
    citas.forEach(cita => {
      const medicoId = cita.medicoId;
      if (!citasPorMedico[medicoId]) {
        citasPorMedico[medicoId] = {
          medico: cita.Medico,
          citas: [],
          total: 0
        };
      }
      citasPorMedico[medicoId].citas.push(cita);
      citasPorMedico[medicoId].total++;
    });
    
    res.json({ 
      success: true, 
      citas,
      total: citas.length,
      citasPorMedico,
      totalMedicos: Object.keys(citasPorMedico).length
    });
    
  } catch (error) {
    console.error('Error obteniendo todas las citas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener todas las citas', 
      error: error.message 
    });
  }
};

// --- ACTUALIZAR ESTADO DE CITA (PUT) ---
export const updateCitaEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const usuarioLogueado = req.user;

        if (!['Confirmada', 'Cancelada', 'Completada', 'Pendiente'].includes(estado)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Estado de cita no válido. Use: Confirmada, Cancelada, Completada o Pendiente' 
            });
        }

        // Obtener la cita actual
        const citaActual = await Cita.findByPk(id);
        
        if (!citaActual) {
            return res.status(404).json({ success: false, message: 'Cita no encontrada.' });
        }

        // Validar permisos: Solo el médico asignado o un ADMIN pueden modificar
        if (!ROLES_ADMIN.includes(usuarioLogueado.role) && citaActual.medicoId !== usuarioLogueado.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permiso para modificar esta cita' 
            });
        }

        const [rowsAffected] = await Cita.update({ estado }, { where: { id } });

        if (rowsAffected === 0) {
            return res.status(404).json({ success: false, message: 'No se pudo actualizar la cita.' });
        }

        const updatedCita = await Cita.findByPk(id, {
            include: [
                { model: Paciente, as: 'paciente' },
                { model: User, as: 'Medico' }
            ]
        });

        // Sincronizar con app diabetes
        sendCitaToAmd(updatedCita.toJSON())
            .catch((syncError) => console.error('Error sincronizando estado cita AMD:', syncError.message));

        res.status(200).json({ success: true, cita: updatedCita });
    } catch (error) {
        console.error('Error al actualizar estado de cita:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar la cita.', error: error.message });
    }
};

// ¡IMPORTANTE! He eliminado el bloque 'export { ... }' del final para evitar el error de duplicado.