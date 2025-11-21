import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../models/index.js'; // Usamos db global
const { Documento } = db;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getDocumentos = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const docs = await Documento.findAll({
            where: { pacienteId },
            order: [['createdAt', 'DESC']]
        });
        res.json(docs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener documentos' });
    }
};

export const uploadDocumento = async (req, res) => {
    try {
        const { pacienteId, categoria, cargadoPor } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'No hay archivo' });

        const url = `/uploads/${file.filename}`;

        const documento = await Documento.create({
            pacienteId: parseInt(pacienteId),
            nombre: file.originalname,
            categoria: categoria || 'General',
            cargadoPor: cargadoPor || 'Sistema',
            tamano: file.size,
            url
        });

        res.json(documento);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al guardar en BD' });
    }
};

export const deleteDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Documento.findByPk(id);

        if (!doc) return res.status(404).json({ error: 'No encontrado' });

        // Borrar archivo físico (subimos 3 niveles para llegar a la raíz desde src/controllers)
        const uploadsPath = path.join(__dirname, '../../uploads');
        const filePath = path.join(uploadsPath, path.basename(doc.url));
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await doc.destroy(); // Sequelize usa destroy()
        res.json({ message: 'Eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar' });
    }
};