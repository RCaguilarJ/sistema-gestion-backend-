import db from '../models/index.js';
import { Op } from 'sequelize';

const Paciente = db.Paciente;

// 1. OBTENER TODOS LOS PACIENTES (getAllPacientes)
// --- CORRECCIÓN: Renombrado de 'getPacientes' a 'getAllPacientes' ---
export const getAllPacientes = async (req, res) => {
    try {
        const { id, role } = req.user;
        let whereClause = {};

        console.log(`🔎 Buscando pacientes para: ${role} (ID: ${id})`);

        switch (role) {
            case 'ADMIN':
            case 'SUPER_ADMIN':
                whereClause = {}; // Ven todo
                break;

            case 'DOCTOR':
                whereClause = {
                    [Op.or]: [{ medicoId: id }, { usuarioId: id }]
                };
                break;

            case 'NUTRI':
                whereClause = { nutriologoId: id };
                break;

            case 'ENDOCRINOLOGO':
                // Filtro especial para tu base de datos (columna 'endocrinologo')
                whereClause = { 
                    [Op.or]: [
                        { endocrinologo: id },    
                        { endocrinologoId: id }   
                    ]
                };
                break;

            case 'PODOLOGO':
                whereClause = { podologoId: id };
                break;

            case 'PSICOLOGO':
            case 'PSY':
                whereClause = { psicologoId: id };
                break;

            default:
                // Por seguridad, si no es médico, solo ve lo que creó
                whereClause = { usuarioId: id };
        }

        const pacientes = await Paciente.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        res.json(pacientes);

    } catch (error) {
        console.error("❌ Error al filtrar pacientes:", error);
        res.status(500).json({ message: "Error al obtener la lista de pacientes" });
    }
};

// 2. CREAR PACIENTE (createPaciente)
export const createPaciente = async (req, res) => {
    try {
        const { nombre, email, ...otrosDatos } = req.body;
        const usuarioId = req.user.id; 

        if (!nombre) {
            return res.status(400).json({ message: "El nombre es obligatorio" });
        }

        if (email) {
            const existe = await Paciente.findOne({ where: { email } });
            if (existe) {
                return res.status(409).json({ message: "Ya existe un paciente con este email" });
            }
        }

        const nuevoPaciente = await Paciente.create({
            nombre,
            email,
            usuarioId, 
            ...otrosDatos
        });

        res.status(201).json({ 
            message: "Paciente registrado exitosamente", 
            paciente: nuevoPaciente 
        });

    } catch (error) {
        console.error("Error al crear paciente:", error);
        res.status(500).json({ message: "Error interno al registrar paciente" });
    }
};

// Obtener un paciente por ID
export const getPaciente = async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.params.id);
        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado" });
        }
        res.json(paciente);
    } catch (error) {
        console.error("❌ Error al obtener paciente:", error);
        res.status(500).json({ message: "Error al obtener paciente" });
    }
};
// 3. OBTENER UN PACIENTE POR ID (getPacienteById)
export const getPacienteById = async (req, res) => {
    try {
        const { id } = req.params;
        const paciente = await Paciente.findByPk(id);

        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado" });
        }
        res.json(paciente);
    } catch (error) {
        console.error("Error obteniendo paciente:", error);
        res.status(500).json({ message: "Error al obtener el paciente" });
    }
};

// 4. ACTUALIZAR PACIENTE (updatePaciente)
export const updatePaciente = async (req, res) => {
    try {
        const { id } = req.params;
        const paciente = await Paciente.findByPk(id);

        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado" });
        }

        await paciente.update(req.body);
        res.json({ message: "Paciente actualizado correctamente", paciente });

    } catch (error) {
        console.error("Error actualizando paciente:", error);
        res.status(500).json({ message: "Error al actualizar datos" });
    }
};

// 5. ELIMINAR PACIENTE (deletePaciente)
export const deletePaciente = async (req, res) => {
    try {
        const { id } = req.params;
        const borrado = await Paciente.destroy({ where: { id } });

        if (!borrado) {
            return res.status(404).json({ message: "Paciente no encontrado" });
        }
        res.json({ message: "Paciente eliminado correctamente" });

    } catch (error) {
        console.error("Error eliminando paciente:", error);
        res.status(500).json({ message: "Error al eliminar paciente" });
    }
};

// 6. OBTENER PACIENTES POR DOCTOR (getAllPacientesByDoctor)
export const getAllPacientesByDoctor = async (req, res) => {
    try {
        const doctorId = req.query.doctorId;
        if (!doctorId) {
            return res.status(400).json({ message: "Falta el parámetro doctorId" });
        }
        const pacientes = await Paciente.findAll({
            where: { medicoId: doctorId }
        });
        res.json(pacientes);
    } catch (error) {
        console.error("Error en getAllPacientesByDoctor:", error);
        res.status(500).json({ message: "Error interno al obtener pacientes" });
    }
};

// Normaliza el payload de Paciente para asegurar formato y campos
export function normalizePacientePayload(payload) {
    // Ejemplo: normaliza nombres, fechas, y elimina campos vacíos
    const normalized = { ...payload };
    if (normalized.nombre) {
        normalized.nombre = normalized.nombre.trim();
    }
    if (normalized.email) {
        normalized.email = normalized.email.toLowerCase().trim();
    }
    if (normalized.fechaNacimiento) {
        normalized.fechaNacimiento = new Date(normalized.fechaNacimiento).toISOString().slice(0, 10);
    }
    // Elimina campos vacíos
    Object.keys(normalized).forEach(key => {
        if (normalized[key] === null || normalized[key] === undefined || normalized[key] === "") {
            delete normalized[key];
        }
    });
    return normalized;
}    const paciente = await db.Paciente.findOne({ where: whereClause });
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado para actualizar.' });
    }

    // Verificar unicidad de CURP si se está cambiando
    if (payload.curp && payload.curp !== paciente.curp) {
        const curpOwner = await db.Paciente.findOne({ where: { curp: payload.curp } });
