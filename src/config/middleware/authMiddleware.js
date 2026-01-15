import jwt from 'jsonwebtoken';
// Si usas un archivo de configuración para el secreto, impórtalo aquí.
// Si lo tienes en process.env, asegúrate de usar la misma variable.
const JWT_SECRET = process.env.JWT_SECRET || "secreto_temporal_super_seguro"; // Asegúrate de que coincida con authController

export const verifyToken = (req, res, next) => {
    try {
        let token = req.headers['authorization'];

        // --- SOLUCIÓN PARA SSE (NOTIFICACIONES) ---
        // Si no hay header de autorización, buscamos en la URL (?token=...)
        if (!token && req.query.token) {
            token = req.query.token;
        }
        // ------------------------------------------

        if (!token) {
            return res.status(403).json({ message: "No se proporcionó un token de seguridad" });
        }

        // Limpiar el prefijo 'Bearer ' si viene en el header
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }

        // Verificar el token
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "No autorizado (Token inválido o expirado)" });
            }
            
            // Guardamos los datos del usuario en la request para usarlos en los controladores
            req.user = decoded;
            next();
        });

    } catch (error) {
        return res.status(401).json({ message: "No autorizado" });
    }
};

// Si tienes un middleware para verificar roles (isAdmin, isDoctor), déjalo igual, 
// solo asegúrate de que verifyToken sea el primero en ejecutarse.
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: "Requiere rol de Administrador" });
    }
};
// ... otros roles ...