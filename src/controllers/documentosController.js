import path from "path";
import fs from "fs/promises";
import db from "../models/index.js";

const UPLOADS_DIR = path.resolve("uploads");

const getPublicBaseUrl = (req) => {
  const envBase =
    process.env.PUBLIC_BASE_URL ||
    process.env.PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.API_URL;
  if (envBase) {
    return envBase.replace(/\/+$/, "");
  }
  return `${req.protocol}://${req.get("host")}`;
};

const buildPublicPath = (filename) => `/uploads/${filename}`;

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
      url: buildPublicPath(safeFilename),
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
    const baseUrl = getPublicBaseUrl(req);
    const normalized = documentos.map((d) => {
      const json = d.toJSON();
      const filename = path.basename(json.url || "");
      if (filename) {
        json.url = `${baseUrl}/uploads/${filename}`;
      }
      json.downloadUrl = `${baseUrl}/api/documentos/${json.id}/descargar`;
      return json;
    });
    return res.json(normalized);
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

export const downloadDocumento = async (req, res) => {
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

    const filename = path.basename(doc.url || "");
    if (!filename) {
      return res.status(400).json({ message: "Documento sin archivo asociado" });
    }

    const filePath = path.join(UPLOADS_DIR, filename);
    return res.download(filePath, doc.nombre || filename);
  } catch (error) {
    console.error("Error al descargar documento:", error);
    return res.status(500).json({ message: "Error al descargar documento" });
  }
};
