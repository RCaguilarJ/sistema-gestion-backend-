// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Validar que JWT_SECRET esté configurado en producción
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET must be set in production environment');
}

// Usar un fallback solo en desarrollo (nunca en producción)
export const getJWTSecret = () => {
  if (JWT_SECRET) {
    return JWT_SECRET;
  }
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET is required in production');
  }
  
  console.warn('⚠️  WARNING: Using development JWT secret. DO NOT use in production!');
  return "clave_secreta_super_segura_sistema_medico_2024";
};
