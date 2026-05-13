import { Op } from "sequelize";
import db from "../models/index.js";
import { ADMIN_ROLES, ADMIN_VIEW_ROLES } from "../constants/roles.js";

const SPECIALIST_ROLE_FIELD_MAP = {
  DOCTOR: "medicoId",
  NUTRI: "nutriologoId",
  PSY: "psicologoId",
  PSICOLOGO: "psicologoId",
  ENDOCRINOLOGO: "endocrinologoId",
  PODOLOGO: "podologoId",
};

const ALL_ASSIGNMENT_FIELDS = [
  "usuarioId",
  "medicoId",
  "nutriologoId",
  "psicologoId",
  "endocrinologoId",
  "podologoId",
];

const mergeWhere = (...clauses) => {
  const validClauses = clauses.filter(
    (clause) => clause && typeof clause === "object" && Object.keys(clause).length > 0
  );

  if (validClauses.length === 0) return {};
  if (validClauses.length === 1) return validClauses[0];
  return { [Op.and]: validClauses };
};

export const parseInteger = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeRole = (value) => {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const isAdminRole = (role) => ADMIN_ROLES.includes(normalizeRole(role));
export const canViewAdminData = (role) => ADMIN_VIEW_ROLES.includes(normalizeRole(role));

export const getPacienteOwnerField = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "PATIENT") return "usuarioId";
  return SPECIALIST_ROLE_FIELD_MAP[normalizedRole] || null;
};

export const buildSpecialistPacienteWhere = (specialistId) => ({
  [Op.or]: [
    { medicoId: specialistId },
    { nutriologoId: specialistId },
    { psicologoId: specialistId },
    { endocrinologoId: specialistId },
    { podologoId: specialistId },
  ],
});

export const buildPacienteAccessWhere = (user) => {
  const role = normalizeRole(user?.role);
  if (canViewAdminData(role)) return {};

  const userId = parseInteger(user?.id);
  const ownerField = getPacienteOwnerField(role);
  if (!userId || !ownerField) {
    return { id: null };
  }

  return { [ownerField]: userId };
};

export const buildPacienteScopedWhere = (user, extraWhere = {}) =>
  mergeWhere(extraWhere, buildPacienteAccessWhere(user));

export const findAccessiblePacienteById = async (user, pacienteId, options = {}) => {
  const id = parseInteger(pacienteId);
  if (!id) return null;

  return db.Paciente.findOne({
    ...options,
    where: buildPacienteScopedWhere(user, { id }),
  });
};

export const ensurePacienteAccess = async (user, pacienteId, options = {}) =>
  findAccessiblePacienteById(user, pacienteId, options);

export const getEffectiveSpecialistId = (user, requestedSpecialistId) => {
  const role = normalizeRole(user?.role);
  const requestedId = parseInteger(requestedSpecialistId);

  if (canViewAdminData(role)) {
    return requestedId;
  }

  const userId = parseInteger(user?.id);
  const ownerField = getPacienteOwnerField(role);

  if (!userId || !ownerField || ownerField === "usuarioId") {
    return null;
  }

  if (requestedId && requestedId !== userId) {
    return 0;
  }

  return userId;
};

export const applyPacienteWriteScope = (user, payload = {}) => {
  const role = normalizeRole(user?.role);
  if (canViewAdminData(role)) {
    return { ...payload };
  }

  const userId = parseInteger(user?.id);
  const ownerField = getPacienteOwnerField(role);
  const scopedPayload = { ...payload };

  if (!userId || !ownerField) {
    return scopedPayload;
  }

  ALL_ASSIGNMENT_FIELDS.forEach((field) => {
    if (field !== ownerField && field !== "usuarioId") {
      delete scopedPayload[field];
    }
  });

  scopedPayload.usuarioId = userId;
  scopedPayload[ownerField] = userId;

  return scopedPayload;
};
