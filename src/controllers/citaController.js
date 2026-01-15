import db from '../models/index.js';

// Ajusta si en tu index.js definiste 'citas' en minúscula o 'Cita'
const Cita = db.Cita || db.citas; 
const Paciente = db.Paciente;
const User = db.User; 

// 1. CREAR CITA Y ASIGNAR PACIENTE (createCita)
export const createCita = async (req, res) => {
    try {
        const { 
            usuarioId, medicoId, especialidad, fecha, hora, motivo,
            // Datos del paciente (recibidos desde el PHP)
            nombrePaciente, emailPaciente, telefonoPaciente, curpPaciente,
            ...otrosDatos 
        } = req.body;

        if (!usuarioId || !fecha || !hora || !medicoId) {
            return res.status(400).json({ 
                success: false, 
                message: "Faltan datos obligatorios (usuarioId, fecha, hora, medicoId)" 
            });
        }

        const fechaHoraCita = `${fecha} ${hora}:00`; 

        // A) BLINDAJE: Verificar si ya existe cita en ese horario
        const citaExistente = await Cita.findOne({
            where: {
                usuarioId: usuarioId, 
                fecha_cita: fechaHoraCita, 
                estado: ['pendiente', 'confirmada'] 
            }
        });

        if (citaExistente) {
            return res.status(409).json({ 
                success: false,
                message: "Ya tienes una cita agendada para esta fecha y hora." 
            });
        }

        // B) LOGICA DE ASIGNACIÓN AUTOMÁTICA DE ESPECIALISTA
        // Buscamos el rol del médico para saber en qué columna guardarlo
        const especialista = await User.findByPk(medicoId);
        let columnaAsignacion = 'medicoId'; // Por defecto

        if (especialista) {
            switch (especialista.role) {
                case 'NUTRI': columnaAsignacion = 'nutriologoId'; break;
                case 'PSY': 
                case 'PSICOLOGO': columnaAsignacion = 'psicologoId'; break;
                // NOTA: En tu SQL la columna se llama 'endocrinologo', sin Id
                case 'ENDOCRINOLOGO': columnaAsignacion = 'endocrinologo'; break; 
                case 'PODOLOGO': columnaAsignacion = 'podologoId'; break;
                default: columnaAsignacion = 'medicoId';
            }
        }

        // C) GESTIÓN DEL EXPEDIENTE DEL PACIENTE
        // Buscamos si el paciente ya existe en la tabla 'pacientes'
        let paciente = await Paciente.findOne({ where: { usuarioId: usuarioId } });

        if (paciente) {
            // Si ya existe, le asignamos este nuevo especialista (ej. si ya iba con Nutri y ahora va con Podólogo)
            await paciente.update({
                [columnaAsignacion]: medicoId
            });
        } else {
            // Si NO existe, creamos el expediente nuevo
            // Usamos los datos enviados desde PHP

            const {
                pacienteId, medicoId, fecha, hora, motivo, notas, especialidad, ...otrosDatos
            } = req.body;

            if (!pacienteId || !fecha || !hora || !medicoId) {
                return res.status(400).json({
                    success: false,
                    message: "Faltan datos obligatorios (pacienteId, fecha, hora, medicoId)"
                });
            }

            const fechaHora = `${fecha} ${hora}:00`;

            // Verificar si ya existe cita en ese horario para ese paciente
            const citaExistente = await Cita.findOne({
                where: {
                    pacienteId: pacienteId,
                    fechaHora: fechaHora,
                    estado: ['Pendiente', 'Confirmada']
                }
            });

            if (citaExistente) {
                return res.status(409).json({
                    success: false,
                    message: "Ya tienes una cita agendada para esta fecha y hora."
                });
            }

            // Crear la cita
            const nuevaCita = await Cita.create({
                pacienteId,
                medicoId,
                fechaHora,
                motivo,
                notas,
                estado: 'Pendiente',
                especialidad,
                ...otrosDatos
            });

            res.status(201).json({
                success: true,
                message: "Cita agendada correctamente",
                data: nuevaCita
            });
        }
    } catch (error) {
        console.error("Error al crear cita:", error);
        res.status(500).json({ success: false, message: "Error interno al procesar la solicitud." });
    }
};

// 6. OBTENER CITA POR ID (getCitaById)
export const getCitaById = async (req, res) => {
    try {
        const { id } = req.params;
        const cita = await Cita.findByPk(id);
        if (!cita) return res.status(404).json({ message: "Cita no encontrada" });
        res.json(cita);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la cita" });
    }
};

// 7. ACTUALIZAR CITA (updateCita)
export const updateCita = async (req, res) => {
    try {
        const { id } = req.params;
        const cita = await Cita.findByPk(id);
        if (!cita) return res.status(404).json({ message: "Cita no encontrada" });
        await cita.update(req.body);
        res.json({ message: "Cita actualizada correctamente", cita });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la cita" });
    }
};

// 8. ELIMINAR CITA (deleteCita)
export const deleteCita = async (req, res) => {
    try {
        const { id } = req.params;
        const filas = await Cita.destroy({ where: { id } });
        if (filas === 0) return res.status(404).json({ message: "Cita no encontrada" });
        res.json({ message: "Cita eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la cita" });
    }
};

// 9. ACTUALIZAR ESTADO DE CITA (updateCitaEstado)
export const updateCitaEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        // Validar el estado recibido contra la lista de valores permitidos
        const allowedEstados = ["pendiente", "confirmada", "cancelada", "completada"];
        if (typeof estado !== "string" || !allowedEstados.includes(estado)) {
            return res.status(400).json({
                message: "Estado de cita inválido",
                allowedEstados,
            });
        }
        const cita = await Cita.findByPk(id);
        if (!cita) return res.status(404).json({ message: "Cita no encontrada" });
        cita.estado = estado;
        await cita.save();
        res.json({ message: "Estado de la cita actualizado correctamente", cita });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el estado de la cita" });
    }
};

// 10. OBTENER TODAS LAS CITAS (getAllCitas)
export const getAllCitas = async (req, res) => {
    try {
        const citas = await Cita.findAll({
            order: [['fechaHora', 'ASC']]
        });
        res.json(citas);
    } catch (error) {
        console.error("Error al obtener citas:", error);
        res.status(500).json({ message: "Error al obtener las citas" });
    }
};

export const getCitasByPacienteId = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const citas = await Cita.findAll({
            where: { pacienteId },
            order: [['fechaHora', 'DESC']]
        });
        res.json(citas || []);
    } catch (error) {
        console.error("Error al buscar citas del paciente:", error);
        res.status(500).json({ message: "Error al obtener el historial de citas" });
    }
};

export const getMisCitas = async (req, res) => {
    try {
        const userId = req.user.id;
        const citas = await Cita.findAll({
            where: { pacienteId: userId },
            order: [['fechaHora', 'DESC']]
        });
        res.json(citas);
    } catch (error) {
        console.error("Error al obtener mis citas:", error);
        res.status(500).json({ message: "Error al obtener tus citas" });
    }
};

export const getPendingCitasForMedico = async (req, res) => {
    try {
        const medicoId = req.user.id;
        const citas = await Cita.findAll({
            where: {
                medicoId: medicoId,
                estado: 'Pendiente'
            },
            order: [['fechaHora', 'ASC']]
        });
        res.json(citas);
    } catch (error) {
        console.error("Error al obtener citas pendientes:", error);
        res.status(500).json({ message: "Error al obtener solicitudes pendientes" });
    }
};