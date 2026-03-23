// Roles de usuario permitidos en el sistema
export const ROLES = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  RECEPCION: 'RECEPCION',
  DOCTOR: 'DOCTOR',
  NUTRI: 'NUTRI',
  PSY: 'PSY',
  PATIENT: 'PATIENT',
  ENDOCRINOLOGO: 'ENDOCRINOLOGO',
  PODOLOGO: 'PODOLOGO',
  PSICOLOGO: 'PSICOLOGO'
};

// Roles de administradores
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
export const ADMIN_VIEW_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.RECEPCION];
export const READONLY_ROLES = [ROLES.RECEPCION];

// Roles de médicos y especialistas
export const MEDICAL_ROLES = [
  ROLES.DOCTOR,
  ROLES.NUTRI,
  ROLES.PSY,
  ROLES.ENDOCRINOLOGO,
  ROLES.PODOLOGO,
  ROLES.PSICOLOGO
];

// Todos los roles permitidos para registro
export const ALLOWED_ROLES = Object.values(ROLES);

// Verificar si un rol es de administrador
export const isAdmin = (role) => ADMIN_ROLES.includes(role);
export const canViewAdminData = (role) => ADMIN_VIEW_ROLES.includes(role);
export const isReadOnlyRole = (role) => READONLY_ROLES.includes(role);

// Verificar si un rol es médico/especialista
export const isMedical = (role) => MEDICAL_ROLES.includes(role);
