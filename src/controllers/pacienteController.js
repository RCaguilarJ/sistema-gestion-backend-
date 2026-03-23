import db from "../models/index.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { ADMIN_VIEW_ROLES } from "../constants/roles.js";
import {
  normalizeEstadoPago,
  normalizeTallaInput,
  normalizeTipoMembresia,
} from "../utils/pacienteFields.js";

const UPLOADS_DIR = path.resolve("uploads");
const ALLOWED_EXTENSIONS = new Set([".xlsx", ".xls"]);
const HEADER_MAP = {
  nombre: "nombre",
  nombredelpaciente: "nombre",
  curp: "curp",
  fechanacimiento: "fechaNacimiento",
  fechadenacimiento: "fechaNacimiento",
  genero: "genero",
  telefono: "telefono",
  celular: "celular",
  email: "email",
  domicilio: "calleNumero",
  callenumero: "calleNumero",
  colonia: "colonia",
  municipio: "municipio",
  estado: "estado",
  cp: "codigoPostal",
  codigopostal: "codigoPostal",
  grupo: "grupo",
  grupoalquepertenece: "grupo",
  grupodeadultos: "grupoAdultos",
  grupoadultos: "grupoAdultos",
  programa: "programa",
  campana: "campana",
  campaña: "campana",
  tiposervicio: "tipoServicio",
  tipodeservicio: "tipoServicio",
  tipomembresia: "tipoMembresia",
  tipodemembresia: "tipoMembresia",
  membresia: "tipoMembresia",
  estadopago: "estadoPago",
  estadodepago: "estadoPago",
  tipoterapia: "tipoTerapia",
  tipodeterapia: "tipoTerapia",
  responsable: "responsable",
  motivoconsulta: "motivoConsulta",
  motivodeconsulta: "motivoConsulta",
  mesestadistico: "mesEstadistico",
  mes: "mesEstadistico",
  mescorrespondiente: "mesEstadistico",
  primeravez: "primeraVez",
  estatus: "estatus",
  talla: "talla",
  tallacintura: "talla",
  talladecintura: "talla",
  estatura: "estatura",
  peso: "pesoKg",
  pesokg: "pesoKg",
  hba1c: "hba1c",
  imc: "imc",
  tipodiabetes: "tipoDiabetes",
  fechadiagnostico: "fechaDiagnostico",
  fechadediagnostico: "fechaDiagnostico",
  fechadeconsulta: "ultimaVisita",
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
const GENERO_MAP = {
  masculino: "Masculino",
  maculino: "Masculino",
  m: "Masculino",
  hombre: "Masculino",
  femenino: "Femenino",
  f: "Femenino",
  mujer: "Femenino",
  otro: "Otro",
};
const MES_MAP = {
  enero: "Enero",
  febrero: "Febrero",
  marzo: "Marzo",
  abril: "Abril",
  mayo: "Mayo",
  junio: "Junio",
  julio: "Julio",
  agosto: "Agosto",
  septiembre: "Septiembre",
  setiembre: "Septiembre",
  octubre: "Octubre",
  noviembre: "Noviembre",
  diciembre: "Diciembre",
};

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

const normalizeLookupValue = (value, dictionary) => {
  const text = toTrimmedString(value);
  if (!text) return null;
  return dictionary[normalizeHeader(text)] || text;
};

const normalizeGeneroInput = (value) => normalizeLookupValue(value, GENERO_MAP);

const normalizeMesInput = (value) => normalizeLookupValue(value, MES_MAP);

const normalizePhoneInput = (value) => {
  const text = toTrimmedString(value);
  if (!text || text === "0") return null;
  return text;
};

const parseDayMonthYearText = (value) => {
  if (value === null || value === undefined) return null;
  const text = value.toString().trim();
  if (!text) return null;

  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;

  let [, day, month, year] = match;
  if (year.length === 2) {
    year = Number(year) >= 50 ? `19${year}` : `20${year}`;
  }

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  const parsed = new Date(yearNumber, monthNumber - 1, dayNumber);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== yearNumber ||
    parsed.getMonth() !== monthNumber - 1 ||
    parsed.getDate() !== dayNumber
  ) {
    return null;
  }

  return {
    year: `${yearNumber}`,
    month: `${monthNumber}`.padStart(2, "0"),
    day: `${dayNumber}`.padStart(2, "0"),
  };
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
  if (["si", "s", "1", "true", "x", "✓", "check"].includes(text)) return true;
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
  const slashDate = parseDayMonthYearText(text);
  if (slashDate) return `${slashDate.year}-${slashDate.month}-${slashDate.day}`;
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
  const slashDate = parseDayMonthYearText(text);
  if (slashDate) {
    return `${slashDate.year}-${slashDate.month}-${slashDate.day}T12:00:00.000Z`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return `${text}T12:00:00.000Z`;
  }
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

const isAdminImportMode = (req) => normalizeRole(req.body?.especialistaRole) === "ADMIN";

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

const formatSequelizeError = (error) => {
  if (!error || !error.name || !error.errors) return null;
  const isValidation =
    error.name === "SequelizeValidationError" ||
    error.name === "SequelizeUniqueConstraintError";
  if (!isValidation) return null;

  const fields = (error.errors || []).map((e) => ({
    field: e.path,
    message: e.message,
    value: e.value,
    type: e.type,
  }));

  return {
    error: "Datos inválidos o repetidos. Verifique y vuelva a intentar.",
    fields,
    focusField: fields[0]?.field || null,
  };
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

const upsertPacientes = async (pacientes) => {
  return db.sequelize.transaction(async (transaction) => {
    const curps = Array.from(
      new Set(
        pacientes
          .map((p) => toTrimmedString(p.curp))
          .filter((value) => value)
          .map((value) => value.toUpperCase())
      )
    );

    const fallbackPairs = Array.from(
      new Map(
        pacientes
          .filter((p) => !toTrimmedString(p.curp))
          .map((p) => {
            const fallbackKey = getPacienteFallbackIdentityKey(p);
            if (!fallbackKey) return null;
            return [
              fallbackKey,
              {
                nombre: toTrimmedString(p.nombre),
                fechaNacimiento: p.fechaNacimiento || null,
              },
            ];
          })
          .filter(Boolean)
      ).values()
    );

    const whereClauses = [];
    if (curps.length) {
      whereClauses.push({ curp: curps });
    }
    fallbackPairs.forEach((pair) => {
      whereClauses.push({
        nombre: pair.nombre,
        fechaNacimiento: pair.fechaNacimiento,
      });
    });

    const existingRows = whereClauses.length
      ? await db.Paciente.findAll({
          where: { [Op.or]: whereClauses },
          transaction,
        })
      : [];

    const existingByCurp = new Map();
    const existingByFallback = new Map();
    existingRows.forEach((row) => {
      const rowCurp = toTrimmedString(row.curp)?.toUpperCase();
      const fallbackKey = getPacienteFallbackIdentityKey(row);
      if (rowCurp) {
        existingByCurp.set(rowCurp, row);
      }
      if (fallbackKey) {
        existingByFallback.set(fallbackKey, row);
      }
    });

    let created = 0;
    let updated = 0;

    for (const paciente of pacientes) {
      const curp = toTrimmedString(paciente.curp)?.toUpperCase();
      const fallbackKey = getPacienteFallbackIdentityKey(paciente);
      const existing =
        (curp ? existingByCurp.get(curp) : null) ||
        (fallbackKey ? existingByFallback.get(fallbackKey) : null) ||
        null;

      if (existing) {
        const updates = {};
        Object.entries(paciente).forEach(([field, value]) => {
          if (hasMeaningfulValue(value)) {
            updates[field] = value;
          }
        });
        await existing.update(updates, { transaction });
        const updatedCurp = toTrimmedString(existing.curp)?.toUpperCase();
        const updatedFallbackKey = getPacienteFallbackIdentityKey(existing);
        if (updatedCurp) {
          existingByCurp.set(updatedCurp, existing);
        }
        if (updatedFallbackKey) {
          existingByFallback.set(updatedFallbackKey, existing);
        }
        updated += 1;
        continue;
      }

      const createdRow = await db.Paciente.create(paciente, { transaction });
      if (curp) {
        existingByCurp.set(curp, createdRow);
      }
      if (fallbackKey) {
        existingByFallback.set(fallbackKey, createdRow);
      }
      created += 1;
    }

    return { created, updated };
  });
};

const isValidEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const serializePaciente = (row) => {
  if (!row) return row;
  const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
  return {
    ...plain,
    fechaConsulta: plain.ultimaVisita ?? plain.fechaConsulta ?? null,
    talla: plain.talla ?? null,
  };
};

const serializePacientes = (rows) => rows.map(serializePaciente);

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
};

const getPacienteFallbackIdentityKey = (paciente) => {
  const nombre = toTrimmedString(paciente?.nombre);
  if (!nombre) return null;
  return `nombre:${normalizeHeader(nombre)}|fecha:${paciente?.fechaNacimiento || ""}`;
};

const getPacienteIdentityKey = (paciente) => {
  const curp = toTrimmedString(paciente.curp);
  if (curp) return `curp:${curp.toUpperCase()}`;
  return getPacienteFallbackIdentityKey(paciente);
};

const getPacientePriorityTime = (entry) => {
  const source =
    entry?.paciente?.ultimaVisita ||
    entry?.paciente?.fechaDiagnostico ||
    entry?.paciente?.fechaNacimiento;
  if (!source) return entry?.rowNumber || 0;
  const parsed = new Date(source).getTime();
  return Number.isFinite(parsed) ? parsed : entry?.rowNumber || 0;
};

const consolidatePacienteEntries = (entries) => {
  const byIdentity = new Map();

  entries.forEach((entry) => {
    const key = getPacienteIdentityKey(entry.paciente);
    if (!key) {
      byIdentity.set(`row:${entry.rowNumber}`, [entry]);
      return;
    }
    const bucket = byIdentity.get(key) || [];
    bucket.push(entry);
    byIdentity.set(key, bucket);
  });

  let mergedRows = 0;
  const consolidated = [];

  byIdentity.forEach((group) => {
    const sorted = [...group].sort((a, b) => {
      const timeDiff = getPacientePriorityTime(b) - getPacientePriorityTime(a);
      if (timeDiff !== 0) return timeDiff;
      return b.rowNumber - a.rowNumber;
    });

    const base = { ...sorted[0].paciente };
    for (const entry of sorted.slice(1)) {
      Object.entries(entry.paciente).forEach(([field, value]) => {
        if (!hasMeaningfulValue(base[field]) && hasMeaningfulValue(value)) {
          base[field] = value;
        }
      });
    }

    if (group.length > 1) {
      mergedRows += group.length - 1;
    }

    consolidated.push({
      paciente: base,
      rowNumber: sorted[0].rowNumber,
      sourceRows: group.map((entry) => entry.rowNumber),
    });
  });

  return {
    entries: consolidated,
    mergedRows,
    mergedPatients: consolidated.filter((entry) => entry.sourceRows.length > 1).length,
  };
};

const normalizePacientePayload = (payload) => {
  const normalized = { ...(payload || {}) };
  if (
    !Object.prototype.hasOwnProperty.call(normalized, "ultimaVisita") &&
    Object.prototype.hasOwnProperty.call(normalized, "fechaConsulta")
  ) {
    normalized.ultimaVisita = normalized.fechaConsulta;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "genero")) {
    normalized.genero = normalizeGeneroInput(normalized.genero);
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "mesEstadistico")) {
    normalized.mesEstadistico = normalizeMesInput(normalized.mesEstadistico);
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "telefono")) {
    normalized.telefono = normalizePhoneInput(normalized.telefono);
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "celular")) {
    normalized.celular = normalizePhoneInput(normalized.celular);
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "primeraVez")) {
    const primeraVez = parseBoolean(normalized.primeraVez);
    if (primeraVez !== null) {
      normalized.primeraVez = primeraVez;
    } else {
      delete normalized.primeraVez;
    }
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "fechaNacimiento")) {
    normalized.fechaNacimiento = parseDateOnly(normalized.fechaNacimiento);
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "fechaDiagnostico")) {
    normalized.fechaDiagnostico = parseDateOnly(normalized.fechaDiagnostico);
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "ultimaVisita")) {
    normalized.ultimaVisita = parseDateTime(normalized.ultimaVisita);
  }
  delete normalized.fechaConsulta;
  if (Object.prototype.hasOwnProperty.call(normalized, "talla")) {
    normalized.talla = normalizeTallaInput(normalized.talla);
  }
  return normalized;
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
  const primeraVezProvided = Object.prototype.hasOwnProperty.call(mapped, "primeraVez");
  const estatus = toTrimmedString(mapped.estatus);

  const paciente = {
    nombre: toTrimmedString(mapped.nombre),
    curp: toTrimmedString(mapped.curp),
    fechaNacimiento: parseDateOnly(mapped.fechaNacimiento),
    genero: normalizeGeneroInput(mapped.genero),
    telefono: normalizePhoneInput(mapped.telefono),
    celular: normalizePhoneInput(mapped.celular),
    email: toTrimmedString(mapped.email),
    calleNumero: toTrimmedString(mapped.calleNumero),
    colonia: toTrimmedString(mapped.colonia),
    municipio: toTrimmedString(mapped.municipio),
    estado: toTrimmedString(mapped.estado),
    codigoPostal: toTrimmedString(mapped.codigoPostal),
    grupo: toTrimmedString(mapped.grupo),
    grupoAdultos: toTrimmedString(mapped.grupoAdultos),
    programa: toTrimmedString(mapped.programa),
    campana: toTrimmedString(mapped.campana),
    tipoMembresia: normalizeTipoMembresia(mapped.tipoMembresia),
    estadoPago: normalizeEstadoPago(mapped.estadoPago),
    tipoServicio: toTrimmedString(mapped.tipoServicio),
    tipoTerapia: toTrimmedString(mapped.tipoTerapia),
    responsable: toTrimmedString(mapped.responsable),
    motivoConsulta: toTrimmedString(mapped.motivoConsulta),
    mesEstadistico: normalizeMesInput(mapped.mesEstadistico),
    primeraVez: primeraVezProvided ? Boolean(primeraVez) : undefined,
    estatus: estatus || undefined,
    talla: normalizeTallaInput(mapped.talla),
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

const findDuplicatePacienteRows = (entries) => {
  const errors = [];
  const duplicateRows = new Set();
  const seen = new Map();

  entries.forEach(({ paciente, rowNumber }) => {
    const curp = toTrimmedString(paciente.curp);
    const duplicateKey = curp
      ? `curp:${curp.toUpperCase()}`
      : paciente.nombre
        ? `nombre:${normalizeHeader(paciente.nombre)}|fecha:${paciente.fechaNacimiento || ""}`
        : null;

    if (!duplicateKey) return;

    const found = seen.get(duplicateKey);
    if (!found) {
      seen.set(duplicateKey, {
        rowNumbers: [rowNumber],
        field: curp ? "curp" : "nombre",
        value: curp || paciente.nombre,
      });
      return;
    }

    found.rowNumbers.push(rowNumber);
  });

  seen.forEach(({ rowNumbers, field, value }) => {
    if (rowNumbers.length < 2) return;
    rowNumbers.forEach((rowNumber) => duplicateRows.add(rowNumber));
    errors.push({
      row: rowNumbers[0],
      field,
      message: `${field === "curp" ? "CURP" : "Paciente"} repetido en el archivo (${value}) en filas ${rowNumbers.join(", ")}. Este Excel parece registrar consultas, no pacientes únicos.`,
    });
  });

  return { errors, duplicateRows };
};

const validatePacienteRow = (paciente, rowNumber, options = {}) => {
  const errors = [];
  const { allowWithoutEspecialista = false } = options;

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
    !allowWithoutEspecialista &&
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
    const isAdmin = ADMIN_VIEW_ROLES.includes(role);
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
      include,
      order: [["updatedAt", "DESC"], ["id", "DESC"]],
    });
    return res.json(serializePacientes(rows));
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
    return res.json(serializePaciente(row));
  } catch (error) {
    console.error("Error obteniendo paciente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ✅ CREATE
export const createPaciente = async (req, res) => {
  try {
    const pacienteData = normalizePacientePayload(req.body);

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
    return res.status(201).json(serializePaciente(nuevo));
  } catch (error) {
    const formatted = formatSequelizeError(error);
    if (formatted) {
      console.error("Error de validación al registrar paciente:", error);
      return res.status(400).json(formatted);
    }
    console.error("Error al registrar paciente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ✅ UPDATE
export const updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizePacientePayload(req.body);

    const row = await db.Paciente.findByPk(id);
    if (!row) return res.status(404).json({ error: "Paciente no encontrado" });

    await row.update(payload);
    return res.json(serializePaciente(row));
  } catch (error) {
    const formatted = formatSequelizeError(error);
    if (formatted) {
      console.error("Error de validacion al actualizar paciente:", error);
      return res.status(400).json(formatted);
    }
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
      return res.status(403).json({ error: "No autorizado para eliminar este paciente" });
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
      order: [["updatedAt", "DESC"], ["id", "DESC"]],
    });

    return res.json(serializePacientes(rows));
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

    const adminImportMode = isAdminImportMode(req);
    const defaultUsuarioId = parseInteger(req.body?.usuarioId || req.user?.id);
    const especialistaDefaults = buildEspecialistaDefaults(req);
    const validEntries = [];
    const errors = [];

    rows.forEach((row, index) => {
      const paciente = buildPacienteFromRow(row, defaultUsuarioId);
      applyEspecialistaDefaults(paciente, especialistaDefaults);
      assignByUserRole(paciente, req.user);
      const rowNumber = index + 2;
      const rowErrors = validatePacienteRow(paciente, rowNumber, {
        allowWithoutEspecialista: adminImportMode,
      });
      if (rowErrors.length) {
        errors.push(...rowErrors);
      } else {
        validEntries.push({ paciente, rowNumber });
      }
    });

    const duplicateCheck = adminImportMode
      ? { errors: [], duplicateRows: new Set() }
      : findDuplicatePacienteRows(validEntries);
    errors.push(...duplicateCheck.errors);

    const uniqueEntries = adminImportMode
      ? consolidatePacienteEntries(validEntries).entries
      : validEntries.filter(({ rowNumber }) => !duplicateCheck.duplicateRows.has(rowNumber));
    const validRows = uniqueEntries.map(({ paciente }) => paciente);

    const missingIds = await findMissingEspecialistaIds(validRows);
    if (missingIds.length) {
      errors.push({
        row: null,
        field: "especialistaId",
        message: `IDs de especialista no existentes en usuarios: ${missingIds.join(", ")}`,
      });
    }

    const existingCurps = adminImportMode ? new Set() : await findExistingCurps(validRows);
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
      validos: uniqueEntries.length,
      invalidos: rows.length - uniqueEntries.length,
      errors,
      migracionAdmin: adminImportMode,
      preview: uniqueEntries.slice(0, 20).map(({ rowNumber, paciente }) => ({
        rowNumber,
        ...serializePaciente(paciente),
      })),
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

    const adminImportMode = isAdminImportMode(req);
    const defaultUsuarioId = parseInteger(req.body?.usuarioId || req.user?.id);
    const especialistaDefaults = buildEspecialistaDefaults(req);
    const validEntries = [];
    const errors = [];

    rows.forEach((row, index) => {
      const paciente = buildPacienteFromRow(row, defaultUsuarioId);
      applyEspecialistaDefaults(paciente, especialistaDefaults);
      assignByUserRole(paciente, req.user);
      const rowNumber = index + 2;
      const rowErrors = validatePacienteRow(paciente, rowNumber, {
        allowWithoutEspecialista: adminImportMode,
      });
      if (rowErrors.length) {
        errors.push(...rowErrors);
      } else {
        validEntries.push({ paciente, rowNumber });
      }
    });

    const duplicateCheck = adminImportMode
      ? { errors: [], duplicateRows: new Set() }
      : findDuplicatePacienteRows(validEntries);
    errors.push(...duplicateCheck.errors);

    const uniqueEntries = adminImportMode
      ? consolidatePacienteEntries(validEntries).entries
      : validEntries.filter(({ rowNumber }) => !duplicateCheck.duplicateRows.has(rowNumber));
    const pacientes = uniqueEntries.map(({ paciente }) => paciente);

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

    const existingCurps = adminImportMode ? new Set() : await findExistingCurps(pacientes);
    if (existingCurps.size > 0) {
      return res.status(400).json({
        error: "curps duplicados",
        message: `CURP ya registradas: ${Array.from(existingCurps).join(", ")}`,
      });
    }

    const result = adminImportMode
      ? await upsertPacientes(pacientes)
      : { created: (await db.Paciente.bulkCreate(pacientes, { validate: true })).length, updated: 0 };
    return res.status(201).json({
      total: rows.length,
      importados: result.created + result.updated,
      creados: result.created,
      actualizados: result.updated,
      migracionAdmin: adminImportMode,
    });
  } catch (error) {
    console.error("Error importando excel:", error);
    return res.status(500).json({ error: "error interno del servidor" });
  }
};
