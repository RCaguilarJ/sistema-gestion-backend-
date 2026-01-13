// Roles de usuario permitidos en el sistema
export const ROLES = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
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

// Roles de médicos y especialistas
export const MEDICAL_ROLES = [
  ROLES.DOCTOR,
  ROLES.NUTRI,
  ROLES.ENDOCRINOLOGO,
  ROLES.PODOLOGO,
  ROLES.PSICOLOGO
];

// Todos los roles permitidos para registro
export const ALLOWED_ROLES = Object.values(ROLES);

// Verificar si un rol es de administrador
export const isAdmin = (role) => ADMIN_ROLES.includes(role);

// Verificar si un rol es médico/especialista
export const isMedical = (role) => MEDICAL_ROLES.includes(role);
