// controllers/documentosController.js
import fs from 'fs';
import path from 'path';
import Documento from '../models/Documento.js';

export const getDocumentos = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const docs = await Documento.find({ pacienteId }).sort({ fecha: -1 });
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
        if (!file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        // Puedes mover el archivo/renombrar, subir a S3, etc.
        const url = `/uploads/${file.filename}`; // ajustar según tu lógica

        const documento = await Documento.create({
            pacienteId,
            nombre: file.originalname,
            categoria,
            cargadoPor,
            tamano: file.size,
            url
        });

        res.json(documento);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al subir documento' });
    }
};

export const deleteDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Documento.findById(id);
        if (!doc) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        // Si tienes archivos locales puedes borrarlos:
        const filePath = path.join(__dirname, '../uploads/', path.basename(doc.url));
        fs.unlink(filePath, (err) => {
            if (err) console.warn('No se pudo borrar archivo físico:', err);
        });

        await doc.deleteOne();
        res.json({ message: 'Documento eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar documento' });
    }
};
