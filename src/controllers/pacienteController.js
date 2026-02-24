import db from "../models/index.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";

const UPLOADS_DIR = path.resolve("uploads");
const ALLOWED_EXTENSIONS = new Set([".xlsx", ".xls"]);
const HEADER_MAP = {
  nombre: "nombre",
  curp: "curp",
  fechanacimiento: "fechaNacimiento",
  genero: "genero",
  telefono: "telefono",
  celular: "celular",
  email: "email",
  callenumero: "calleNumero",
  colonia: "colonia",
  municipio: "municipio",
  estado: "estado",
  codigopostal: "codigoPostal",
  grupo: "grupo",
  tiposervicio: "tipoServicio",
  tipoterapia: "tipoTerapia",
  responsable: "responsable",
  motivoconsulta: "motivoConsulta",
  mesestadistico: "mesEstadistico",
  primeravez: "primeraVez",
  estatus: "estatus",
  estatura: "estatura",
  peso: "pesoKg",
  pesokg: "pesoKg",
  hba1c: "hba1c",
  imc: "imc",
  tipodiabetes: "tipoDiabetes",
  fechadiagnostico: "fechaDiagnostico",
  riesgo: "riesgo",
  ultimavisita: "ultimaVisita",
  usuarioid: "usuarioId",
  idusuario: "usuarioId",
  usuario: "usuarioId",
  nutriologoid: "nutriologoId",
  medicoid: "medicoId",
  psicologoid: "psicologoId",
  endocrinologoid: "endocrinologoId",
  podologoid: "podologoId",
};

const ALLOWED_GENERO = new Set(["Masculino", "Femenino", "Otro"]);
const ALLOWED_ESTATUS = new Set(["Activo", "Inactivo"]);
const ALLOWED_TIPO_DIABETES = new Set(["Tipo 1", "Tipo 2", "Gestacional", "Otro"]);
const ALLOWED_RIESGO = new Set(["Alto", "Medio", "Bajo"]);

const normalizeHeader = (value) => {
  if (value === null || value === undefined) return "";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const toTrimmedString = (value) => {
  if (value === null || value === undefined) return null;
  const text = value.toString().trim();
  return text.length > 0 ? text : null;
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = value.toString().replace(",", ".").replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseInteger = (value) => {
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  const intValue = Math.trunc(parsed);
  return Number.isFinite(intValue) ? intValue : null;
};

const parseBoolean = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  const text = value.toString().trim().toLowerCase();
  if (["si", "s", "1", "true"].includes(text)) return true;
  if (["no", "n", "0", "false"].includes(text)) return false;
  return null;
};

const parseDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = value.toString().trim();
  if (!text) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/");
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const parseDateTime = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  const text = value.toString().trim();
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const normalizeRole = (value) => {
  if (!value) return null;
  return value
    .toString()
    .trim()
    .toUpperCase()
    .replace("Ó", "O")
    .replace("Í", "I")
    .replace("Á", "A")
    .replace("É", "E")
    .replace("Ú", "U");
};

const roleToEspecialistaField = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "DOCTOR") return "medicoId";
  if (normalized === "NUTRI") return "nutriologoId";
  if (normalized === "PSICOLOGO" || normalized === "PSY") return "psicologoId";
  if (normalized === "ENDOCRINOLOGO") return "endocrinologoId";
  if (normalized === "PODOLOGO") return "podologoId";
  return null;
};

const buildEspecialistaDefaults = (req) => {
  const defaults = {};
  const role = normalizeRole(req.body?.especialistaRole);
  const idFromRole = parseInteger(req.body?.especialistaId);
  if (role && idFromRole) {
    const field = roleToEspecialistaField(role);
    if (field) defaults[field] = idFromRole;
  }

  const medicoId = parseInteger(req.body?.medicoId);
  const nutriologoId = parseInteger(req.body?.nutriologoId);
  const psicologoId = parseInteger(req.body?.psicologoId);
  const endocrinologoId = parseInteger(req.body?.endocrinologoId);
  const podologoId = parseInteger(req.body?.podologoId);

  if (medicoId) defaults.medicoId = medicoId;
  if (nutriologoId) defaults.nutriologoId = nutriologoId;
  if (psicologoId) defaults.psicologoId = psicologoId;
  if (endocrinologoId) defaults.endocrinologoId = endocrinologoId;
  if (podologoId) defaults.podologoId = podologoId;

  return defaults;
};

const applyEspecialistaDefaults = (paciente, defaults) => {
  if (!paciente.medicoId && defaults.medicoId) paciente.medicoId = defaults.medicoId;
  if (!paciente.nutriologoId && defaults.nutriologoId) paciente.nutriologoId = defaults.nutriologoId;
  if (!paciente.psicologoId && defaults.psicologoId) paciente.psicologoId = defaults.psicologoId;
  if (!paciente.endocrinologoId && defaults.endocrinologoId) paciente.endocrinologoId = defaults.endocrinologoId;
  if (!paciente.podologoId && defaults.podologoId) paciente.podologoId = defaults.podologoId;
};

const assignByUserRole = (paciente, user) => {
  const role = normalizeRole(user?.role);
  const creatorId = user?.id;
  if (!creatorId) return;
  const field = roleToEspecialistaField(role);
  if (field && !paciente[field]) {
    paciente[field] = creatorId;
  }
};

const collectEspecialistaIds = (pacientes) => {
  const ids = new Set();
  pacientes.forEach((p) => {
    [p.medicoId, p.nutriologoId, p.psicologoId, p.endocrinologoId, p.podologoId]
      .filter((value) => Number.isFinite(value) && value > 0)
      .forEach((value) => ids.add(value));
  });
  return Array.from(ids);
};

const findMissingEspecialistaIds = async (pacientes) => {
  const ids = collectEspecialistaIds(pacientes);
  if (ids.length === 0) return [];
  const users = await db.User.findAll({
    where: { id: ids },
    attributes: ["id"],
  });
  const existing = new Set(users.map((u) => u.id));
  return ids.filter((id) => !existing.has(id));
};

const findExistingCurps = async (pacientes) => {
  const curps = pacientes
    .map((p) => (p.curp || "").toString().trim())
    .filter((value) => value.length > 0);
  if (curps.length === 0) return new Set();
  const rows = await db.Paciente.findAll({
    where: { curp: curps },
    attributes: ["curp"],
  });
  return new Set(rows.map((r) => r.curp));
};

const isValidEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const resolveExcelPath = (req) => {
  if (req.file?.path) return req.file.path;
  const fromBody = req.body?.archivo || req.body?.filename || req.body?.path;
  if (!fromBody || typeof fromBody !== "string") return null;
  const safeName = path.basename(fromBody);
  const fullPath = path.resolve(UPLOADS_DIR, safeName);
  if (!fullPath.toLowerCase().startsWith(UPLOADS_DIR.toLowerCase())) {
    return null;
  }
  return fullPath;
};

const buildPacienteFromRow = (row, defaultUsuarioId) => {
  const mapped = {};
  for (const [key, value] of Object.entries(row)) {
    const normalized = normalizeHeader(key);
    const target = HEADER_MAP[normalized];
    if (target) mapped[target] = value;
  }

  const primeraVez = parseBoolean(mapped.primeraVez);
  const estatus = toTrimmedString(mapped.estatus);

  const paciente = {
    nombre: toTrimmedString(mapped.nombre),
    curp: toTrimmedString(mapped.curp),
    fechaNacimiento: parseDateOnly(mapped.fechaNacimiento),
    genero: toTrimmedString(mapped.genero),
    telefono: toTrimmedString(mapped.telefono),
    celular: toTrimmedString(mapped.celular),
    email: toTrimmedString(mapped.email),
    calleNumero: toTrimmedString(mapped.calleNumero),
    colonia: toTrimmedString(mapped.colonia),
    municipio: toTrimmedString(mapped.municipio),
    estado: toTrimmedString(mapped.estado),
    codigoPostal: toTrimmedString(mapped.codigoPostal),
    grupo: toTrimmedString(mapped.grupo),
    tipoServicio: toTrimmedString(mapped.tipoServicio),
    tipoTerapia: toTrimmedString(mapped.tipoTerapia),
    responsable: toTrimmedString(mapped.responsable),
    motivoConsulta: toTrimmedString(mapped.motivoConsulta),
    mesEstadistico: toTrimmedString(mapped.mesEstadistico),
    primeraVez: primeraVez !== null ? primeraVez : undefined,
    estatus: estatus || undefined,
    estatura: parseNumber(mapped.estatura),
    pesoKg: parseNumber(mapped.pesoKg),
    hba1c: parseNumber(mapped.hba1c),
    imc: parseNumber(mapped.imc),
    tipoDiabetes: toTrimmedString(mapped.tipoDiabetes),
    fechaDiagnostico: parseDateOnly(mapped.fechaDiagnostico),
    riesgo: toTrimmedString(mapped.riesgo),
    ultimaVisita: parseDateTime(mapped.ultimaVisita),
    usuarioId: parseInteger(mapped.usuarioId ?? defaultUsuarioId),
    nutriologoId: parseInteger(mapped.nutriologoId),
    medicoId: parseInteger(mapped.medicoId),
    psicologoId: parseInteger(mapped.psicologoId),
    endocrinologoId: parseInteger(mapped.endocrinologoId),
    podologoId: parseInteger(mapped.podologoId),
  };

  return paciente;
};

const validatePacienteRow = (paciente, rowNumber) => {
  const errors = [];

  if (!paciente.nombre) {
    errors.push({ row: rowNumber, field: "nombre", message: "nombre requerido" });
  }
  if (!paciente.usuarioId || paciente.usuarioId <= 0) {
    errors.push({ row: rowNumber, field: "usuarioId", message: "usuarioId requerido" });
  }
  if (paciente.email && !isValidEmail(paciente.email)) {
    errors.push({ row: rowNumber, field: "email", message: "email invalido" });
  }
  if (paciente.genero && !ALLOWED_GENERO.has(paciente.genero)) {
    errors.push({ row: rowNumber, field: "genero", message: "genero invalido" });
  }
  if (paciente.estatus && !ALLOWED_ESTATUS.has(paciente.estatus)) {
    errors.push({ row: rowNumber, field: "estatus", message: "estatus invalido" });
  }
  if (paciente.tipoDiabetes && !ALLOWED_TIPO_DIABETES.has(paciente.tipoDiabetes)) {
    errors.push({ row: rowNumber, field: "tipoDiabetes", message: "tipoDiabetes invalido" });
  }
  if (paciente.riesgo && !ALLOWED_RIESGO.has(paciente.riesgo)) {
    errors.push({ row: rowNumber, field: "riesgo", message: "riesgo invalido" });
  }
  if (
    !paciente.medicoId &&
    !paciente.nutriologoId &&
    !paciente.psicologoId &&
    !paciente.endocrinologoId &&
    !paciente.podologoId
  ) {
    errors.push({
      row: rowNumber,
      field: "especialista",
      message: "especialista requerido (selecciona uno en el importador o agrega ID en el Excel)",
    });
  }

  return errors;
};

const parseExcelRows = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
};

// ✅ GET ALL
export const getAllPacientes = async (req, res) => {
  try {
    const role = (req.user?.role || "").toString().trim().toUpperCase();
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const where = isAdmin
      ? {
          [Op.or]: [
            { medicoId: { [Op.not]: null } },
            { nutriologoId: { [Op.not]: null } },
            { psicologoId: { [Op.not]: null } },
            { endocrinologoId: { [Op.not]: null } },
            { podologoId: { [Op.not]: null } },
          ],
        }
      : undefined;
    const include = isAdmin
      ? [
          { model: db.User, as: "medico", attributes: ["id", "nombre", "role"] },
          { model: db.User, as: "nutriologo", attributes: ["id", "nombre", "role"] },
          { model: db.User, as: "psicologo", attributes: ["id", "nombre", "role"] },
          { model: db.User, as: "endocrinologo", attributes: ["id", "nombre", "role"] },
          { model: db.User, as: "podologo", attributes: ["id", "nombre", "role"] },
        ]
      : undefined;
    const rows = await db.Paciente.findAll({
      where,
      include,
      order: [["id", "DESC"]],
    });
    return res.json(rows);
  } catch (error) {
    console.error("Error obteniendo pacientes:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ✅ GET ONE
export const getPacienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await db.Paciente.findByPk(id);
    if (!row) return res.status(404).json({ error: "Paciente no encontrado" });
    return res.json(row);
  } catch (error) {
    console.error("Error obteniendo paciente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ✅ CREATE
export const createPaciente = async (req, res) => {
  try {
    const pacienteData = req.body;

    if (!pacienteData?.nombre || !pacienteData?.usuarioId) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: nombre, usuarioId.",
      });
    }

    const role = (req.user?.role || "").toString().trim().toUpperCase();
    const creatorId = req.user?.id;
    if (creatorId) {
      if (role === "DOCTOR" && !pacienteData.medicoId) {
        pacienteData.medicoId = creatorId;
      } else if (role === "NUTRI" && !pacienteData.nutriologoId) {
        pacienteData.nutriologoId = creatorId;
      } else if ((role === "PSICOLOGO" || role === "PSY") && !pacienteData.psicologoId) {
        pacienteData.psicologoId = creatorId;
      } else if (role === "ENDOCRINOLOGO" && !pacienteData.endocrinologoId) {
        pacienteData.endocrinologoId = creatorId;
      } else if (role === "PODOLOGO" && !pacienteData.podologoId) {
        pacienteData.podologoId = creatorId;
      }
    }

    const nuevo = await db.Paciente.create(pacienteData);
    return res.status(201).json(nuevo);
  } catch (error) {
    console.error("Error al registrar paciente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ✅ UPDATE
export const updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const row = await db.Paciente.findByPk(id);
    if (!row) return res.status(404).json({ error: "Paciente no encontrado" });

    await row.update(req.body);
    return res.json(row);
  } catch (error) {
    console.error("Error actualizando paciente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ✅ DELETE
export const deletePaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const row = await db.Paciente.findByPk(id);
    if (!row) return res.status(404).json({ error: "Paciente no encontrado" });

    const role = normalizeRole(req.user?.role);
    const isAdminRole = role === "ADMIN" || role === "SUPER_ADMIN";
    if (!isAdminRole) {
      const field = roleToEspecialistaField(role);
      const userId = req.user?.id;
      if (!field || !userId || row[field] !== userId) {
        return res.status(403).json({ error: "No autorizado para eliminar este paciente" });
      }
    }

    await row.destroy();
    return res.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando paciente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ✅ GET /api/pacientes/especialista/:especialistaId (tabla `pacientes`)
export const getPacientesByEspecialista = async (req, res) => {
  try {
    const { especialistaId } = req.params;
    const id = Number(especialistaId);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "especialistaId inválido" });
    }

    const rows = await db.Paciente.findAll({
      where: {
        [Op.or]: [
          { medicoId: id },
          { nutriologoId: id },
          { psicologoId: id },
          { endocrinologoId: id },
          { podologoId: id },
        ],
      },
      order: [["id", "DESC"]],
    });

    return res.json(rows);
  } catch (error) {
    console.error("Error obteniendo pacientes por especialista:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const validateImportPacientes = async (req, res) => {
  try {
    const filePath = resolveExcelPath(req);
    if (!filePath) {
      return res.status(400).json({ error: "archivo requerido" });
    }
    const ext = path.extname(filePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({ error: "formato de archivo no soportado" });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "archivo no encontrado" });
    }

    const rows = parseExcelRows(filePath);
    if (!rows.length) {
      return res.status(400).json({ error: "el archivo no tiene filas" });
    }

    const defaultUsuarioId = parseInteger(req.body?.usuarioId || req.user?.id);
    const especialistaDefaults = buildEspecialistaDefaults(req);
    const validRows = [];
    const errors = [];

    rows.forEach((row, index) => {
      const paciente = buildPacienteFromRow(row, defaultUsuarioId);
      applyEspecialistaDefaults(paciente, especialistaDefaults);
      assignByUserRole(paciente, req.user);
      const rowNumber = index + 2;
      const rowErrors = validatePacienteRow(paciente, rowNumber);
      if (rowErrors.length) {
        errors.push(...rowErrors);
      } else {
        validRows.push(paciente);
      }
    });

    const missingIds = await findMissingEspecialistaIds(validRows);
    if (missingIds.length) {
      errors.push({
        row: null,
        field: "especialistaId",
        message: `IDs de especialista no existentes en usuarios: ${missingIds.join(", ")}`,
      });
    }

    const existingCurps = await findExistingCurps(validRows);
    if (existingCurps.size > 0) {
      existingCurps.forEach((curp) => {
        errors.push({
          row: null,
          field: "curp",
          message: `CURP ya registrada: ${curp}`,
        });
      });
    }

    return res.json({
      total: rows.length,
      validos: validRows.length,
      invalidos: rows.length - validRows.length,
      errors,
      preview: validRows.slice(0, 20),
    });
  } catch (error) {
    console.error("Error validando excel:", error);
    return res.status(500).json({ error: "error interno del servidor" });
  }
};

export const importPacientesFromExcel = async (req, res) => {
  try {
    const filePath = resolveExcelPath(req);
    if (!filePath) {
      return res.status(400).json({ error: "archivo requerido" });
    }
    const ext = path.extname(filePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({ error: "formato de archivo no soportado" });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "archivo no encontrado" });
    }

    const rows = parseExcelRows(filePath);
    if (!rows.length) {
      return res.status(400).json({ error: "el archivo no tiene filas" });
    }

    const defaultUsuarioId = parseInteger(req.body?.usuarioId || req.user?.id);
    const especialistaDefaults = buildEspecialistaDefaults(req);
    const pacientes = [];
    const errors = [];

    rows.forEach((row, index) => {
      const paciente = buildPacienteFromRow(row, defaultUsuarioId);
      applyEspecialistaDefaults(paciente, especialistaDefaults);
      assignByUserRole(paciente, req.user);
      const rowNumber = index + 2;
      const rowErrors = validatePacienteRow(paciente, rowNumber);
      if (rowErrors.length) {
        errors.push(...rowErrors);
      } else {
        pacientes.push(paciente);
      }
    });

    if (errors.length) {
      return res.status(400).json({
        error: "validacion fallida",
        total: rows.length,
        validos: pacientes.length,
        invalidos: rows.length - pacientes.length,
        errors,
      });
    }

    const missingIds = await findMissingEspecialistaIds(pacientes);
    if (missingIds.length) {
      return res.status(400).json({
        error: "ids de especialista invalidos",
        message: `IDs de especialista no existentes en usuarios: ${missingIds.join(", ")}`,
      });
    }

    const existingCurps = await findExistingCurps(pacientes);
    if (existingCurps.size > 0) {
      return res.status(400).json({
        error: "curps duplicados",
        message: `CURP ya registradas: ${Array.from(existingCurps).join(", ")}`,
      });
    }

    const created = await db.Paciente.bulkCreate(pacientes, { validate: true });
    return res.status(201).json({
      total: rows.length,
      importados: created.length,
    });
  } catch (error) {
    console.error("Error importando excel:", error);
    return res.status(500).json({ error: "error interno del servidor" });
  }
};
