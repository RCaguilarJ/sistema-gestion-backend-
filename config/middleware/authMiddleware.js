import jwt from 'jsonwebtoken';

// Nota: usamos la misma clave que en `authController.js`.
const JWT_SECRET = 'mi-secreto-muy-seguro-para-tokens';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    // decoded contiene { id, email, role }
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permisos insuficientes' });
    }

    return next();
  };
};
