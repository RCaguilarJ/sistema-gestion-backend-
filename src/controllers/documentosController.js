// Subir un documento (básico, solo placeholder)
export const uploadDocumento = async (req, res) => {
    try {
        // Aquí deberías manejar la lógica de subida de archivos con multer o similar
        // Por ahora solo responde con éxito simulado
        res.json({ message: "Documento subido correctamente (placeholder)" });
    } catch (error) {
        console.error("Error al subir documento:", error);
        res.status(500).json({ message: "Error al subir documento" });
    }
};
// Obtener todos los documentos
export const getDocumentos = async (req, res) => {
    try {
        const Documento = db.Documento;
        if (!Documento) {
            return res.status(500).json({ message: "Modelo Documento no disponible" });
        }
        const documentos = await Documento.findAll();
        res.json(documentos);
    } catch (error) {
        console.error("Error al obtener documentos:", error);
        res.status(500).json({ message: "Error al obtener documentos" });
    }
};
// Eliminar un documento por ID
export const deleteDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const Documento = db.Documento;
        if (!Documento) {
            return res.status(500).json({ message: "Modelo Documento no disponible" });
        }
        const doc = await Documento.findByPk(id);
        if (!doc) {
            return res.status(404).json({ message: "Documento no encontrado" });
        }
        await doc.destroy();
        res.json({ message: "Documento eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar documento:", error);
        res.status(500).json({ message: "Error al eliminar documento" });
    }
};
import db from '../models/index.js';

// Extraemos los modelos del objeto db que ya arreglamos
const Paciente = db.Paciente;
const Cita = db.Cita || db.citas;
const User = db.User;

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Validar que los modelos existan antes de usarlos
        if (!Paciente || !Cita || !User) {
            console.error("❌ Error: Modelos no cargados en dashboardController.");
            return res.status(500).json({ message: "Error de configuración de base de datos" });
        }

        // 2. Ejecutar consultas en paralelo para mayor velocidad
        const [
            totalPacientes,
            totalCitas,
            citasPendientes,
            totalDoctores
        ] = await Promise.all([
            Paciente.count(), // Total de pacientes registrados
            Cita.count(),     // Total histórico de citas
            Cita.count({ where: { estado: 'pendiente' } }), // Citas por atender
            User.count({ where: { role: 'DOCTOR' } }) // Total de personal médico
        ]);

        // 3. Responder con los datos
        res.json({
            pacientes: totalPacientes,
            citas: totalCitas,
            pendientes: citasPendientes,
            doctores: totalDoctores
        });

    } catch (error) {
        console.error("❌ Error en Dashboard Stats:", error);
        res.status(500).json({ message: "Error al obtener estadísticas del dashboard" });
    }
};