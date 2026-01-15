import jwt from 'jsonwebtoken';
import { getJWTSecret } from '../constants/config.js';

export const authenticate = (req, res, next) => {
  let token = req.headers['authorization'];

  // Permitir token por query string (para SSE y otros casos)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  // Limpiar el prefijo 'Bearer ' si viene en el header
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, getJWTSecret());
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error de token:", error.message);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Usuario no autenticado.' });
    }
    
    // Comparación exacta de roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para realizar esta acción.',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }
    next();
  };
};