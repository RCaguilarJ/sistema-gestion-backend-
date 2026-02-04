import db from "../models/index.js";

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  const text = value.toString().trim();
  if (!text) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/");
    return new Date(`${year}-${month}-${day}`);
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toTrimmedString = (value) => {
  if (value === null || value === undefined) return null;
  const text = value.toString().trim();
  return text.length > 0 ? text : null;
};

const normalizeEstadoCita = (estado) => {
  if (!estado) return "Pendiente";
  const value = estado.toString().trim().toLowerCase();
  if (value === "confirmada" || value === "confirmado") return "Confirmada";
  if (value === "pendiente") return "Pendiente";
  if (value === "cancelada" || value === "cancelado") return "Cancelada";
  if (value === "completada" || value === "completado") return "Completada";
  return "Pendiente";
};

export const getCitasByPacienteId = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const pacienteIdNumber = Number(pacienteId);
    if (!Number.isFinite(pacienteIdNumber) || pacienteIdNumber <= 0) {
      return res.status(400).json({ error: "pacienteId invalido" });
    }

    const rows = await db.Cita.findAll({
      where: { pacienteId: pacienteIdNumber },
      order: [["fechaHora", "DESC"]],
    });

    return res.json(rows);
  } catch (error) {
    console.error("Error obteniendo citas del paciente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const createCitaByPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const pacienteIdNumber = Number(pacienteId);
    if (!Number.isFinite(pacienteIdNumber) || pacienteIdNumber <= 0) {
      return res.status(400).json({ error: "pacienteId invalido" });
    }

    const body = req.body || {};
    const fechaHora = parseDate(body.fechaHora ?? body.fecha ?? body.fecha_cita);
    const motivo = toTrimmedString(body.motivo ?? body.descripcion);
    const notas = toTrimmedString(body.notas ?? body.nota ?? body.comentarios);
    const medicoId = Number(body.medicoId ?? req.user?.id);
    const estado = normalizeEstadoCita(body.estado);

    if (!fechaHora) {
      return res.status(400).json({ error: "fechaHora requerida" });
    }
    if (!motivo) {
      return res.status(400).json({ error: "motivo requerido" });
    }
    if (!Number.isFinite(medicoId) || medicoId <= 0) {
      return res.status(400).json({ error: "medicoId requerido" });
    }

    const nueva = await db.Cita.create({
      fechaHora,
      motivo,
      notas,
      estado,
      pacienteId: pacienteIdNumber,
      medicoId,
    });

    return res.status(201).json(nueva);
  } catch (error) {
    console.error("Error creando cita del paciente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getCitasByDoctor = async (req, res) => {
  try {
    const { medicoId } = req.params;

    const rows = await db.sequelize.query(
      `
      SELECT 
        id, usuario_id, medico_id, nombre, email, telefono, especialidad,
        fecha_cita, descripcion, estado, fecha_registro, fecha_actualizacion
      FROM citas
      WHERE medico_id = :medicoId
      ORDER BY fecha_cita DESC
      `,
      {
        replacements: { medicoId: Number(medicoId) },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    return res.json(rows);
  } catch (error) {
    console.error("Error obteniendo citas del doctor:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getCitasAmd = async (req, res) => {
  try {
    const medicoId = Number(req.query.medicoId);
    const role = (req.user?.role || "").toString().trim().toUpperCase();
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const hasMedicoFilter = !isAdmin && Number.isFinite(medicoId) && medicoId > 0;
    const rows = await db.sequelize.query(
      `
        SELECT
          c.*,
          p.nombre AS pacienteNombre,
          u.nombre AS medicoNombre
        FROM cita c
        LEFT JOIN pacientes p ON p.id = c.pacienteId
        LEFT JOIN users u ON u.id = c.medicoId
        ${hasMedicoFilter ? "WHERE c.medicoId = :medicoId" : ""}
        ORDER BY c.fechaHora DESC
      `,
      {
        replacements: hasMedicoFilter ? { medicoId } : {},
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    return res.json(rows);
  } catch (error) {
    console.error("Error obteniendo citas AMD:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const normalizeEstadoPortal = (estado) => {
  if (!estado) return "pendiente";
  const value = estado.toString().trim().toLowerCase();
  if (value === "confirmada" || value === "confirmado") return "confirmada";
  if (value === "pendiente") return "pendiente";
  if (value === "cancelada" || value === "cancelado") return "cancelada";
  return value;
};

export const getCitasPortal = async (req, res) => {
  try {
    const medicoId = Number(req.query.medicoId);
    const role = (req.user?.role || "").toString().trim().toUpperCase();
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const hasMedicoFilter = !isAdmin && Number.isFinite(medicoId) && medicoId > 0;
    const filtros = [];
    if (!isAdmin) {
      filtros.push("LOWER(c.estado) NOT IN ('confirmada', 'confirmado')");
      if (hasMedicoFilter) {
        filtros.push("c.medico_id = :medicoId");
      }
    }
    const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

    const rows = await db.sequelize.query(
      `
        SELECT 
          c.id,
          c.usuario_id AS usuarioId,
          c.medico_id AS medicoId,
          c.nombre AS pacienteNombre,
          c.email AS pacienteEmail,
          c.telefono AS pacienteTelefono,
          u.nombre AS medicoNombre,
          c.especialidad,
          c.fecha_cita AS fechaHora,
          c.descripcion AS motivo,
          c.estado,
          c.fecha_registro AS fechaRegistro
        FROM citas c
        LEFT JOIN users u ON u.id = c.medico_id
        ${whereClause}
        ORDER BY c.fecha_cita DESC
      `,
      {
        replacements: hasMedicoFilter ? { medicoId } : {},
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    return res.json(
      rows.map((row) => ({
        ...row,
        estado: normalizeEstadoPortal(row.estado),
        source: "portal",
      }))
    );
  } catch (error) {
    console.error("Error obteniendo citas portal:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateCitaEstado = async (req, res) => {
  try {
    const { citaId } = req.params;
    const estado = normalizeEstadoAmd(req.body?.estado);

    const cita = await db.Cita.findByPk(Number(citaId));
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    await cita.update({ estado });
    return res.json({ ok: true, estado });
  } catch (error) {
    console.error("Error actualizando estado de cita AMD:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateCitaPortalEstado = async (req, res) => {
  try {
    const { citaId } = req.params;
    const estado = normalizeEstadoPortal(req.body?.estado);

    if (!estado) {
      return res.status(400).json({ error: "Estado invalido." });
    }

    const cita = await db.Citas.findByPk(Number(citaId));
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    const estabaConfirmada = normalizeEstadoPortal(cita.estado) === "confirmada";
    const debeCrearPaciente = estado === "confirmada" && !estabaConfirmada;

    if (debeCrearPaciente) {
      await db.sequelize.transaction(async (transaction) => {
        await cita.update({ estado }, { transaction });
        await createPacienteAndCitaFromPortal(cita, req.body, transaction);
      });
    } else {
      await cita.update({ estado });
    }

    return res.json({ ok: true, estado });
  } catch (error) {
    console.error("Error actualizando estado de cita portal:", error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : "Error interno del servidor";
    return res.status(statusCode).json({ error: message });
  }
};

const normalizeEstadoAmd = (estado) => {
  if (!estado) return "Pendiente";
  const value = estado.toString().trim().toLowerCase();
  if (value === "confirmada" || value === "confirmado") return "Confirmada";
  if (value === "pendiente") return "Pendiente";
  if (value === "cancelada" || value === "cancelado") return "Cancelada";
  if (value === "completada" || value === "completado") return "Completada";
  return "Pendiente";
};

export const createPacienteFromCita = async (req, res) => {
  try {
    const { citaId } = req.params;
    const cita = await db.Citas.findByPk(Number(citaId));

    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    const { paciente, cita: nuevaCita, reutilizado } = await createPacienteAndCitaFromPortal(cita, req.body);
    return res.status(201).json({ paciente, cita: nuevaCita, reutilizado });
  } catch (error) {
    console.error("Error creando paciente desde cita:", error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : "Error interno del servidor";
    return res.status(statusCode).json({ error: message });
  }
};

const resolveSpecialistField = (role) => {
  if (!role) return "medicoId";
  const value = role.toString().trim().toUpperCase();
  if (value === "NUTRI") return "nutriologoId";
  if (value === "PSICOLOGO" || value === "PSY") return "psicologoId";
  if (value === "ENDOCRINOLOGO") return "endocrinologoId";
  if (value === "PODOLOGO") return "podologoId";
  return "medicoId";
};

const buildSpecialistAssignment = async (medicoId, transaction) => {
  const especialista = await db.User.findByPk(Number(medicoId), { transaction });
  const field = resolveSpecialistField(especialista?.role);
  return { [field]: Number(medicoId) };
};

const createPacienteAndCitaFromPortal = async (cita, body, transaction) => {
  const payload = { ...(body || {}) };
  payload.nombre = payload.nombre || payload.paciente || payload.PACIENTE || cita.nombre;
  payload.email = payload.email || cita.email;
  payload.telefono = payload.telefono || cita.telefono;
  payload.usuarioId = payload.usuarioId || cita.medico_id;
  payload.curp =
    payload.curp ||
    payload.curpPaciente ||
    payload.curp_paciente ||
    payload.paciente_curp;
  if (typeof payload.curp === "string") {
    const trimmedCurp = payload.curp.trim();
    payload.curp = trimmedCurp.length > 0 ? trimmedCurp : null;
  } else if (!payload.curp) {
    payload.curp = null;
  }
  if (!payload.curp) {
    const baseId = payload.usuarioId || cita.usuario_id || "PORTAL";
    payload.curp = `TEMP-${baseId}-${Date.now()}`;
  }

  if (!payload.nombre || !payload.usuarioId) {
    const error = new Error("Faltan campos obligatorios para crear el paciente.");
    error.statusCode = 400;
    throw error;
  }

  const especialistaAsignacion = await buildSpecialistAssignment(cita.medico_id, transaction);

  let paciente = null;
  let reutilizado = false;
  if (payload.nombre && payload.curp) {
    paciente = await db.Paciente.findOne({
      where: { nombre: payload.nombre, curp: payload.curp },
      transaction,
    });
    reutilizado = Boolean(paciente);
  }

  if (paciente) {
    await paciente.update(
      { ...especialistaAsignacion, estatus: "Activo" },
      { transaction }
    );
  } else {
    paciente = await db.Paciente.create(
      { ...payload, ...especialistaAsignacion, estatus: "Activo" },
      { transaction }
    );
  }

  const nuevaCita = await db.Cita.create(
    {
      pacienteId: paciente.id,
      medicoId: cita.medico_id,
      fechaHora: cita.fecha_cita,
      motivo: cita.descripcion || cita.especialidad || "Cita",
      notas: cita.descripcion || null,
      estado: normalizeEstadoAmd(cita.estado),
    },
    { transaction }
  );

  return { paciente, cita: nuevaCita, reutilizado };
};

