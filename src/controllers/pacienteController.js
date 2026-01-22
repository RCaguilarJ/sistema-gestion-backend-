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

  return errors;
};

const parseExcelRows = (filePath) => {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
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
    const validRows = [];
    const errors = [];

    rows.forEach((row, index) => {
      const paciente = buildPacienteFromRow(row, defaultUsuarioId);
      const rowNumber = index + 2;
      const rowErrors = validatePacienteRow(paciente, rowNumber);
      if (rowErrors.length) {
        errors.push(...rowErrors);
      } else {
        validRows.push(paciente);
      }
    });

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
    const pacientes = [];
    const errors = [];

    rows.forEach((row, index) => {
      const paciente = buildPacienteFromRow(row, defaultUsuarioId);
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
