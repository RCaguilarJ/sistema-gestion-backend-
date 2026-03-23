import db from "../models/index.js";
import { ADMIN_VIEW_ROLES } from "../constants/roles.js";

const parseDate = (v) => {
  if (!v) return null;
  const p = new Date(v);
  return Number.isNaN(p.getTime()) ? null : p;
};

const toTrimmedString = (v) =>
  v === null || v === undefined ? null : v.toString().trim() || null;

const normalizeEstadoCita = (e) => {
  if (!e) return "Pendiente";
  const v = e.toString().trim().toLowerCase();
  if (v === "confirmada" || v === "confirmado") return "Confirmada";
  if (v === "cancelada" || v === "cancelado") return "Cancelada";
  return "Pendiente";
};

const normalizeEstadoPortal = (estado) => {
  if (!estado) return "pendiente";
  const value = estado.toString().trim().toLowerCase();
  if (value === "confirmada" || value === "confirmado") return "confirmada";
  if (value === "pendiente") return "pendiente";
  if (value === "cancelada" || value === "cancelado") return "cancelada";
  return value;
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

    const citasApp = rows.map((row) => ({
      ...row.get({ plain: true }),
      source: "app",
    }));

    const paciente = await db.Paciente.findByPk(pacienteIdNumber);
    let citasPortal = [];
    if (paciente) {
      const orFilters = [];
      if (paciente.email) orFilters.push({ email: paciente.email });
      if (paciente.telefono) orFilters.push({ telefono: paciente.telefono });
      if (paciente.celular) orFilters.push({ telefono: paciente.celular });
      if (paciente.nombre) orFilters.push({ nombre: paciente.nombre });

      if (orFilters.length > 0) {
        const portalRows = await db.Citas.findAll({
          where: { [db.Sequelize.Op.or]: orFilters },
          order: [["fecha_cita", "DESC"]],
        });
        citasPortal = portalRows.map((row) => ({
          id: `portal-${row.id}`,
          portalId: row.id,
          fechaHora: row.fecha_cita,
          motivo: row.descripcion || row.especialidad || "Cita",
          notas: row.descripcion || null,
          estado: normalizeEstadoCita(row.estado),
          pacienteId: pacienteIdNumber,
          medicoId: row.medico_id,
          medicoNombre: row.medicoNombre,
          source: "portal",
        }));
      }
    }

    const merged = [...citasApp, ...citasPortal].sort((a, b) => {
      const aTime = a.fechaHora ? new Date(a.fechaHora).getTime() : 0;
      const bTime = b.fechaHora ? new Date(b.fechaHora).getTime() : 0;
      return bTime - aTime;
    });

    return res.json(merged);
  } catch (error) {
    console.error("Error obteniendo citas del paciente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const createCitaByPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const pId = Number(pacienteId);

    // Evita el error 'Unknown column NaN' que vimos en tus logs
    if (Number.isNaN(pId) || pId <= 0) {
      return res.status(400).json({ error: "ID de paciente inválido (NaN)." });
    }

    const body = req.body || {};
    const fechaHora = parseDate(body.fechaHora ?? body.fecha);
    const motivo = toTrimmedString(body.motivo ?? body.descripcion);

    // Resuelve el error 400 asignando un médico por defecto si el front no lo envía
    const medicoId = Number(body.medicoId || req.user?.id || 46);

    if (!fechaHora || !motivo || Number.isNaN(medicoId)) {
      return res.status(400).json({
        error: "Faltan campos obligatorios",
        recibido: { fechaHora, motivo, medicoId },
      });
    }

    const nueva = await db.Cita.create({
      fechaHora,
      motivo,
      notas: toTrimmedString(body.notas) || "",
      estado: normalizeEstadoCita(body.estado),
      pacienteId: pId,
      medicoId,
    });

    return res.status(201).json(nueva);
  } catch (error) {
    console.error("ERROR CRÍTICO:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

export const getCitasByDoctor = async (req, res) => {
  try {
    const { medicoId } = req.params;
    const id = Number(medicoId);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "medicoId invalido" });
    }

    const [appRows, portalRows] = await Promise.all([
      db.sequelize.query(
        `
        SELECT 
          c.id,
          c.fechaHora,
          c.motivo,
          c.notas,
          c.estado,
          c.pacienteId,
          c.createdAt,
          c.updatedAt,
          p.nombre AS pacienteNombre
        FROM cita c
        LEFT JOIN pacientes p ON p.id = c.pacienteId
        WHERE c.medicoId = :medicoId
        ORDER BY c.fechaHora DESC
        `,
        {
          replacements: { medicoId: id },
          type: db.Sequelize.QueryTypes.SELECT,
        }
      ),
      db.sequelize.query(
        `
        SELECT 
          id, usuario_id, medico_id, nombre, email, telefono, especialidad,
          fecha_cita, descripcion, estado, fecha_registro, fecha_actualizacion
        FROM citas
        WHERE medico_id = :medicoId
        ORDER BY fecha_cita DESC
        `,
        {
          replacements: { medicoId: id },
          type: db.Sequelize.QueryTypes.SELECT,
        }
      ),
    ]);

    const formatted = [
      ...appRows.map((row) => ({
        id: row.id,
        usuario_id: null,
        medico_id: id,
        pacienteId: row.pacienteId,
        nombre: row.pacienteNombre || null,
        email: null,
        telefono: null,
        especialidad: null,
        fecha_cita: row.fechaHora,
        descripcion: row.motivo,
        notas: row.notas || null,
        estado: normalizeEstadoPortal(row.estado),
        fecha_registro: row.createdAt,
        fecha_actualizacion: row.updatedAt,
        source: "app",
      })),
      ...portalRows.map((row) => ({
        ...row,
        estado: normalizeEstadoPortal(row.estado),
        source: "portal",
      })),
    ].sort((a, b) => {
      const aDate = a.fecha_cita ? new Date(a.fecha_cita).getTime() : 0;
      const bDate = b.fecha_cita ? new Date(b.fecha_cita).getTime() : 0;
      return bDate - aDate;
    });

    return res.json(formatted);
  } catch (error) {
    console.error("Error obteniendo citas del doctor:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getCitasAmd = async (req, res) => {
  try {
    const medicoId = Number(req.query.medicoId);
    const role = (req.user?.role || "").toString().trim().toUpperCase();
    const isAdmin = ADMIN_VIEW_ROLES.includes(role);
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

export const getCitasPortal = async (req, res) => {
  try {
    const medicoId = Number(req.query.medicoId);
    const role = (req.user?.role || "").toString().trim().toUpperCase();
    const isAdmin = ADMIN_VIEW_ROLES.includes(role);
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

// PUT /api/citas/:citaId (actualizar datos básicos de la cita)
export const updateCita = async (req, res) => {
  try {
    const { citaId } = req.params;
    const updates = {};
    const allowed = ["fechaHora", "motivo", "notas", "estado", "medicoId"];
    allowed.forEach((field) => {
      if (req.body?.[field] !== undefined) updates[field] = req.body[field];
    });

    const cita = await db.Cita.findByPk(Number(citaId));
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    // Normaliza estado si viene
    if (updates.estado) {
      updates.estado = normalizeEstadoAmd(updates.estado);
    }

    // Asegura que siempre haya un medicoId válido para pasar validación notNull
    const medicoFallback =
      updates.medicoId ?? cita.medicoId ?? Number(req.user?.id);
    if (!Number.isFinite(Number(medicoFallback))) {
      return res.status(400).json({ error: "medicoId requerido" });
    }
    updates.medicoId = Number(medicoFallback);

    await cita.update(updates);
    return res.json(cita);
  } catch (error) {
    console.error("Error actualizando cita:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// DELETE /api/citas/:citaId (eliminar cita)
export const deleteCita = async (req, res) => {
  try {
    const { citaId } = req.params;
    const cita = await db.Cita.findByPk(Number(citaId));

    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    await cita.destroy();
    return res.json({ message: "Cita eliminada." });
  } catch (error) {
    console.error("Error eliminando cita:", error);
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
