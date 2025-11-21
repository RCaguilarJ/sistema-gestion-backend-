import jwt from "jsonwebtoken";

// Clave secreta para verificar el token
const JWT_SECRET = process.env.JWT_SECRET || "mi-secreto-muy-seguro-para-tokens";

// --- Autenticación: verifica token y extrae datos del usuario ---
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }

    return next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// --- Autorización por rol: permite solo si el rol está en la lista ---
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Permisos insuficientes" });
    }

    return next();
  };
};

// --- Restricción por prefijo de correo: bloquea si empieza con 'nutri' o 'doctor' ---
export const restrictByEmailPrefix = (req, res, next) => {
  const email = req.user?.email?.toLowerCase();

  if (email?.startsWith("nutri") || email?.startsWith("doctor")) {
    return res.status(403).json({ message: "Acceso denegado a Configuración" });
  }

  return next();
};
