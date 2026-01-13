import jwt from 'jsonwebtoken';

// IMPORTANTE: Usamos la misma clave de respaldo que en authController para evitar desajustes
const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_super_segura_sistema_medico_2024";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    // Verificamos usando la constante JWT_SECRET que definimos arriba
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error de token:", error.message);
    // Si falla, devolvemos 401 para forzar al frontend a desloguear si es necesario
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Usuario no autenticado.' });
    }
    
    // Comparación case-insensitive para soportar 'admin', 'ADMIN', 'Admin', etc.
    const userRole = (req.user.role || '').toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para realizar esta acción.',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }
    next();
  };
};