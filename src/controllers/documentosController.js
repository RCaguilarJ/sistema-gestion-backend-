import path from "path";
import fs from "fs/promises";
import db from "../models/index.js";

const UPLOADS_DIR = path.resolve("uploads");

const buildPublicUrl = (filename) => `/uploads/${filename}`;

export const uploadDocumento = async (req, res) => {
  try {
    const Documento = db.Documento;
    if (!Documento) {
      return res.status(500).json({ message: "Modelo Documento no disponible" });
    }

    const { pacienteId, nombre, categoria } = req.body || {};
    if (!req.file) {
      return res.status(400).json({ message: "archivo requerido" });
    }
    if (!pacienteId) {
      return res.status(400).json({ message: "pacienteId requerido" });
    }

    const safeFilename = path.basename(req.file.filename);
    const record = await Documento.create({
      nombre: nombre || req.file.originalname,
      categoria: categoria || null,
      cargadoPor: req.user?.nombre || null,
      tamano: req.file.size,
      url: buildPublicUrl(safeFilename),
      pacienteId,
    });

    return res.json(record);
  } catch (error) {
    console.error("Error al subir documento:", error);
    return res.status(500).json({ message: "Error al subir documento" });
  }
};

export const getDocumentos = async (req, res) => {
  try {
    const Documento = db.Documento;
    if (!Documento) {
      return res.status(500).json({ message: "Modelo Documento no disponible" });
    }

    const { pacienteId } = req.params || {};
    if (!pacienteId) {
      return res.status(400).json({ message: "pacienteId requerido" });
    }

    const documentos = await Documento.findAll({
      where: { pacienteId },
      order: [["createdAt", "DESC"]],
    });
    return res.json(documentos);
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    return res.status(500).json({ message: "Error al obtener documentos" });
  }
};

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

    const filename = path.basename(doc.url || "");
    if (filename) {
      const filePath = path.join(UPLOADS_DIR, filename);
      await fs.unlink(filePath).catch(() => {});
    }

    return res.json({ message: "Documento eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    return res.status(500).json({ message: "Error al eliminar documento" });
  }
};
