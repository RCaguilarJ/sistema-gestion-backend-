import db from "../models/index.js";

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
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  if (isAdmin) return true;
  if (!userId) return false;
  const paciente = await Paciente.findByPk(pacienteId, {
    attributes: ["id", "psicologoId"],
  });
  if (!paciente) return false;
  if (role === "PSICOLOGO" || role === "PSY") {
    return paciente.psicologoId === userId;
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
