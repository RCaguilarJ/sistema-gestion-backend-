import db from "../models/index.js";
import { ADMIN_VIEW_ROLES } from "../constants/roles.js";

const {
  PsicologiaSesion,
  PsicologiaEvaluacion,
  PsicologiaObjetivo,
  PsicologiaEstrategia,
  PsicologiaNota,
  Paciente,
  User,
} = db;

const parseInteger = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeRole = (value) => {
  if (!value) return null;
  return value
    .toString()
    .trim()
    .toUpperCase()
    .replace("Ã“", "O")
    .replace("Ã", "I")
    .replace("Ã", "A")
    .replace("Ã‰", "E")
    .replace("Ãš", "U");
};

const resolvePsicologoId = (req, payload) => {
  const role = normalizeRole(req.user?.role);
  const creatorId = parseInteger(req.user?.id);
  if ((role === "PSICOLOGO" || role === "PSY") && creatorId && !payload.psicologoId) {
    return creatorId;
  }
  return payload.psicologoId || null;
};

const ensurePacienteAccess = async (req, pacienteId) => {
  const role = normalizeRole(req.user?.role);
  const userId = parseInteger(req.user?.id);
  const isAdmin = ADMIN_VIEW_ROLES.includes(role);
  if (isAdmin) return true;
  if (!userId) return false;
  const paciente = await Paciente.findByPk(pacienteId, {
    attributes: ["id", "psicologoId", "medicoId"],
  });
  if (!paciente) return false;
  if (role === "PSICOLOGO" || role === "PSY") {
    return paciente.psicologoId === userId;
  }
  if (role === "DOCTOR") {
    // Permitir al médico editar si es su paciente; si no tiene asignación, asignarlo.
    if (!paciente.medicoId) {
      await paciente.update({ medicoId: userId });
      return true;
    }
    return paciente.medicoId === userId;
  }
  return false;
};

const attachPsicologoNombre = async (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  const ids = Array.from(new Set(list.map((r) => r.psicologoId).filter(Boolean)));
  if (ids.length === 0) return list;
  const users = await User.findAll({ where: { id: ids }, attributes: ["id", "nombre"] });
  const map = new Map(users.map((u) => [u.id, u.nombre]));
  return list.map((row) => ({
    ...row.toJSON(),
    psicologoNombre: map.get(row.psicologoId) || null,
  }));
};

const validateRange = (value, min, max) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
};

export const getPsicologia = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const id = parseInteger(pacienteId);
    if (!id) return res.status(400).json({ error: "pacienteId invalido" });

    const allowed = await ensurePacienteAccess(req, id);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const [sesionesRaw, evaluacionesRaw, objetivos, estrategias, notasRaw] = await Promise.all([
      PsicologiaSesion.findAll({ where: { pacienteId: id }, order: [["fecha", "DESC"]] }),
      PsicologiaEvaluacion.findAll({ where: { pacienteId: id }, order: [["fecha", "DESC"]] }),
      PsicologiaObjetivo.findAll({ where: { pacienteId: id }, order: [["id", "DESC"]] }),
      PsicologiaEstrategia.findAll({ where: { pacienteId: id }, order: [["id", "DESC"]] }),
      PsicologiaNota.findAll({ where: { pacienteId: id }, order: [["fecha", "DESC"]] }),
    ]);

    const [sesiones, notas] = await Promise.all([
      attachPsicologoNombre(sesionesRaw),
      attachPsicologoNombre(notasRaw),
    ]);
    const evaluaciones = await attachPsicologoNombre(evaluacionesRaw);

    return res.json({
      sesiones,
      evaluaciones,
      objetivos,
      estrategias,
      notas,
    });
  } catch (error) {
    console.error("Error obteniendo psicologia:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const addSesion = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const id = parseInteger(pacienteId);
    if (!id) return res.status(400).json({ error: "pacienteId invalido" });

    const payload = {
      pacienteId: id,
      psicologoId: null,
      fecha: parseDate(req.body?.fecha),
      estadoAnimo: req.body?.estadoAnimo || null,
      adherencia: validateRange(req.body?.adherencia, 0, 100),
      estres: validateRange(req.body?.estres, 1, 10),
      intervenciones: req.body?.intervenciones || null,
      notas: req.body?.notas || null,
    };
    const allowed = await ensurePacienteAccess(req, id);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });
    if (!payload.fecha) return res.status(400).json({ error: "fecha requerida" });
    payload.psicologoId = resolvePsicologoId(req, payload);

    const row = await PsicologiaSesion.create(payload);
    return res.status(201).json(row);
  } catch (error) {
    console.error("Error creando sesion:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateSesion = async (req, res) => {
  try {
    const { pacienteId, sesionId } = req.params;
    const pId = parseInteger(pacienteId);
    const sId = parseInteger(sesionId);
    if (!pId || !sId) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const sesion = await PsicologiaSesion.findOne({
      where: { id: sId, pacienteId: pId },
    });
    if (!sesion) return res.status(404).json({ error: "Sesión no encontrada" });

    const updates = {};
    if (req.body?.fecha !== undefined) {
      const fechaParsed = parseDate(req.body.fecha);
      if (!fechaParsed) return res.status(400).json({ error: "fecha invalida" });
      updates.fecha = fechaParsed;
    }
    if (req.body?.estadoAnimo !== undefined) updates.estadoAnimo = req.body.estadoAnimo;
    if (req.body?.adherencia !== undefined) {
      updates.adherencia = validateRange(req.body.adherencia, 0, 100);
    }
    if (req.body?.estres !== undefined) {
      const val = validateRange(req.body.estres, 1, 10);
      updates.estres = val;
    }
    if (req.body?.intervenciones !== undefined) updates.intervenciones = req.body.intervenciones;
    if (req.body?.notas !== undefined) updates.notas = req.body.notas;

    // Si el rol es psicólogo y no se envió psicologoId, asignar el actual
    const resolvedPsicologo = resolvePsicologoId(req, { psicologoId: sesion.psicologoId });
    if (resolvedPsicologo) updates.psicologoId = resolvedPsicologo;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }

    await sesion.update(updates);
    return res.json(sesion);
  } catch (error) {
    console.error("Error actualizando sesion:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteSesion = async (req, res) => {
  try {
    const { pacienteId, sesionId } = req.params;
    const pId = parseInteger(pacienteId);
    const sId = parseInteger(sesionId);
    if (!pId || !sId) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const sesion = await PsicologiaSesion.findOne({
      where: { id: sId, pacienteId: pId },
    });
    if (!sesion) return res.status(404).json({ error: "Sesión no encontrada" });

    await sesion.destroy();
    return res.json({ message: "Sesión eliminada" });
  } catch (error) {
    console.error("Error eliminando sesion:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const addEvaluacion = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const id = parseInteger(pacienteId);
    if (!id) return res.status(400).json({ error: "pacienteId invalido" });

    const payload = {
      pacienteId: id,
      psicologoId: null,
      titulo: req.body?.titulo || "Evaluacion",
      fecha: parseDate(req.body?.fecha),
      ansiedadScore: req.body?.ansiedadScore || null,
      ansiedadNivel: req.body?.ansiedadNivel || null,
      depresionScore: req.body?.depresionScore || null,
      depresionNivel: req.body?.depresionNivel || null,
      autoeficaciaScore: req.body?.autoeficaciaScore || null,
      autoeficaciaNivel: req.body?.autoeficaciaNivel || null,
      estrategias: req.body?.estrategias || null,
      notas: req.body?.notas || null,
    };
    const allowed = await ensurePacienteAccess(req, id);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });
    if (!payload.titulo) return res.status(400).json({ error: "titulo requerido" });
    if (!payload.fecha) return res.status(400).json({ error: "fecha requerida" });
    payload.psicologoId = resolvePsicologoId(req, payload);

    const row = await PsicologiaEvaluacion.create(payload);
    return res.status(201).json(row);
  } catch (error) {
    console.error("Error creando evaluacion:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateEvaluacion = async (req, res) => {
  try {
    const { pacienteId, evaluacionId } = req.params;
    const pId = parseInteger(pacienteId);
    const eId = parseInteger(evaluacionId);
    if (!pId || !eId) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const evaluacion = await PsicologiaEvaluacion.findOne({
      where: { id: eId, pacienteId: pId },
    });
    if (!evaluacion) return res.status(404).json({ error: "Evaluacion no encontrada" });

    const updates = {};
    if (req.body?.titulo !== undefined) {
      updates.titulo = req.body.titulo;
      if (!updates.titulo) return res.status(400).json({ error: "titulo requerido" });
    }
    if (req.body?.fecha !== undefined) {
      const fechaParsed = parseDate(req.body.fecha);
      if (!fechaParsed) return res.status(400).json({ error: "fecha invalida" });
      updates.fecha = fechaParsed;
    }
    if (req.body?.ansiedadScore !== undefined) updates.ansiedadScore = req.body.ansiedadScore;
    if (req.body?.ansiedadNivel !== undefined) updates.ansiedadNivel = req.body.ansiedadNivel;
    if (req.body?.depresionScore !== undefined) updates.depresionScore = req.body.depresionScore;
    if (req.body?.depresionNivel !== undefined) updates.depresionNivel = req.body.depresionNivel;
    if (req.body?.autoeficaciaScore !== undefined)
      updates.autoeficaciaScore = req.body.autoeficaciaScore;
    if (req.body?.autoeficaciaNivel !== undefined)
      updates.autoeficaciaNivel = req.body.autoeficaciaNivel;
    if (req.body?.estrategias !== undefined) updates.estrategias = req.body.estrategias;
    if (req.body?.notas !== undefined) updates.notas = req.body.notas;

    const resolvedPsicologo = resolvePsicologoId(req, { psicologoId: evaluacion.psicologoId });
    if (resolvedPsicologo) updates.psicologoId = resolvedPsicologo;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }

    await evaluacion.update(updates);
    return res.json(evaluacion);
  } catch (error) {
    console.error("Error actualizando evaluacion:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteEvaluacion = async (req, res) => {
  try {
    const { pacienteId, evaluacionId } = req.params;
    const pId = parseInteger(pacienteId);
    const eId = parseInteger(evaluacionId);
    if (!pId || !eId) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const evaluacion = await PsicologiaEvaluacion.findOne({
      where: { id: eId, pacienteId: pId },
    });
    if (!evaluacion) return res.status(404).json({ error: "Evaluacion no encontrada" });

    await evaluacion.destroy();
    return res.json({ message: "Evaluacion eliminada" });
  } catch (error) {
    console.error("Error eliminando evaluacion:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const addObjetivo = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const id = parseInteger(pacienteId);
    if (!id) return res.status(400).json({ error: "pacienteId invalido" });

    const payload = {
      pacienteId: id,
      psicologoId: null,
      objetivo: req.body?.objetivo || null,
      progreso: validateRange(req.body?.progreso, 0, 100),
      tono: req.body?.tono || null,
    };
    const allowed = await ensurePacienteAccess(req, id);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });
    payload.psicologoId = resolvePsicologoId(req, payload);
    if (!payload.objetivo) {
      return res.status(400).json({ error: "objetivo requerido" });
    }

    const row = await PsicologiaObjetivo.create(payload);
    return res.status(201).json(row);
  } catch (error) {
    console.error("Error creando objetivo:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateObjetivo = async (req, res) => {
  try {
    const { pacienteId, objetivoId } = req.params;
    const pId = parseInteger(pacienteId);
    const oId = parseInteger(objetivoId);
    if (!pId || !oId) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const objetivo = await PsicologiaObjetivo.findOne({
      where: { id: oId, pacienteId: pId },
    });
    if (!objetivo) return res.status(404).json({ error: "Objetivo no encontrado" });

    const updates = {};
    if (req.body?.objetivo !== undefined) {
      updates.objetivo = req.body.objetivo;
      if (!updates.objetivo) return res.status(400).json({ error: "objetivo requerido" });
    }
    if (req.body?.progreso !== undefined) {
      updates.progreso = validateRange(req.body.progreso, 0, 100);
    }
    if (req.body?.tono !== undefined) updates.tono = req.body.tono;

    const resolvedPsicologo = resolvePsicologoId(req, { psicologoId: objetivo.psicologoId });
    if (resolvedPsicologo) updates.psicologoId = resolvedPsicologo;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }

    await objetivo.update(updates);
    return res.json(objetivo);
  } catch (error) {
    console.error("Error actualizando objetivo:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteObjetivo = async (req, res) => {
  try {
    const { pacienteId, objetivoId } = req.params;
    const pId = parseInteger(pacienteId);
    const oId = parseInteger(objetivoId);
    if (!pId || !oId) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const objetivo = await PsicologiaObjetivo.findOne({
      where: { id: oId, pacienteId: pId },
    });
    if (!objetivo) return res.status(404).json({ error: "Objetivo no encontrado" });

    await objetivo.destroy();
    return res.json({ message: "Objetivo eliminado" });
  } catch (error) {
    console.error("Error eliminando objetivo:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const addEstrategia = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const id = parseInteger(pacienteId);
    if (!id) return res.status(400).json({ error: "pacienteId invalido" });

    const payload = {
      pacienteId: id,
      psicologoId: null,
      estrategia: req.body?.estrategia || null,
      frecuencia: req.body?.frecuencia || null,
      estado: req.body?.estado || null,
    };
    const allowed = await ensurePacienteAccess(req, id);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });
    payload.psicologoId = resolvePsicologoId(req, payload);
    if (!payload.estrategia) {
      return res.status(400).json({ error: "estrategia requerida" });
    }

    const row = await PsicologiaEstrategia.create(payload);
    return res.status(201).json(row);
  } catch (error) {
    console.error("Error creando estrategia:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateEstrategia = async (req, res) => {
  try {
    const { pacienteId, estrategiaId } = req.params;
    const pId = parseInteger(pacienteId);
    const eId = parseInteger(estrategiaId);
    if (!pId || !eId) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const estrategia = await PsicologiaEstrategia.findOne({
      where: { id: eId, pacienteId: pId },
    });
    if (!estrategia) return res.status(404).json({ error: "Estrategia no encontrada" });

    const updates = {};
    if (req.body?.estrategia !== undefined) {
      updates.estrategia = req.body.estrategia;
      if (!updates.estrategia) return res.status(400).json({ error: "estrategia requerida" });
    }
    if (req.body?.frecuencia !== undefined) updates.frecuencia = req.body.frecuencia;
    if (req.body?.estado !== undefined) updates.estado = req.body.estado;

    const resolvedPsicologo = resolvePsicologoId(req, { psicologoId: estrategia.psicologoId });
    if (resolvedPsicologo) updates.psicologoId = resolvedPsicologo;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }

    await estrategia.update(updates);
    return res.json(estrategia);
  } catch (error) {
    console.error("Error actualizando estrategia:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteEstrategia = async (req, res) => {
  try {
    const { pacienteId, estrategiaId } = req.params;
    const pId = parseInteger(pacienteId);
    const eId = parseInteger(estrategiaId);
    if (!pId || !eId) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const estrategia = await PsicologiaEstrategia.findOne({
      where: { id: eId, pacienteId: pId },
    });
    if (!estrategia) return res.status(404).json({ error: "Estrategia no encontrada" });

    await estrategia.destroy();
    return res.json({ message: "Estrategia eliminada" });
  } catch (error) {
    console.error("Error eliminando estrategia:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const addNota = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const id = parseInteger(pacienteId);
    if (!id) return res.status(400).json({ error: "pacienteId invalido" });

    const payload = {
      pacienteId: id,
      psicologoId: null,
      nota: req.body?.nota || null,
      fecha: parseDate(req.body?.fecha) || new Date(),
    };
    const allowed = await ensurePacienteAccess(req, id);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });
    payload.psicologoId = resolvePsicologoId(req, payload);
    if (!payload.nota) {
      return res.status(400).json({ error: "nota requerida" });
    }

    const row = await PsicologiaNota.create(payload);
    return res.status(201).json(row);
  } catch (error) {
    console.error("Error creando nota:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateNota = async (req, res) => {
  try {
    const { pacienteId, notaId } = req.params;
    const pId = parseInteger(pacienteId);
    const nId = parseInteger(notaId);
    if (!pId || !nId) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const nota = await PsicologiaNota.findOne({
      where: { id: nId, pacienteId: pId },
    });
    if (!nota) return res.status(404).json({ error: "Nota no encontrada" });

    const updates = {};
    if (req.body?.nota !== undefined) updates.nota = req.body.nota;
    if (req.body?.fecha !== undefined) {
      const fechaParsed = parseDate(req.body.fecha);
      if (!fechaParsed) return res.status(400).json({ error: "fecha invalida" });
      updates.fecha = fechaParsed;
    }

    const resolvedPsicologo = resolvePsicologoId(req, { psicologoId: nota.psicologoId });
    if (resolvedPsicologo) updates.psicologoId = resolvedPsicologo;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }

    await nota.update(updates);
    return res.json(nota);
  } catch (error) {
    console.error("Error actualizando nota:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteNota = async (req, res) => {
  try {
    const { pacienteId, notaId } = req.params;
    const pId = parseInteger(pacienteId);
    const nId = parseInteger(notaId);
    if (!pId || !nId) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const nota = await PsicologiaNota.findOne({
      where: { id: nId, pacienteId: pId },
    });
    if (!nota) return res.status(404).json({ error: "Nota no encontrada" });

    await nota.destroy();
    return res.json({ message: "Nota eliminada" });
  } catch (error) {
    console.error("Error eliminando nota:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
