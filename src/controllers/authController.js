import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { ALLOWED_ROLES } from '../constants/roles.js';
import { getJWTSecret, JWT_EXPIRES_IN } from '../constants/config.js';

export const register = async (req, res) => {
    try {
        const { nombre, username, email, password, role } = req.body;
        const User = db.User;

        // CAMBIO: Solo validamos nombre, email y password (username es opcional)
        if (!nombre || !email || !password) {
            return res.status(400).json({message: "Faltan datos requeridos: nombre, email, password"});
        }
        
        const emailTrim = email.trim().toLowerCase();
        // CAMBIO: Si no hay username, usamos el email
        const usernameTrim = username ? username.trim() : emailTrim;

        if (await User.findOne({ where: { email: emailTrim } })) {
            return res.status(409).json({ message: "Email registrado" });
        }
        
        if (await User.findOne({ where: { username: usernameTrim } })) {
            return res.status(409).json({ message: "Username registrado" });
        }

        const normalizedRole = role && ALLOWED_ROLES.includes(role) ? role : "DOCTOR";

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ 
            nombre, 
            username: usernameTrim,  // Ya no puede ser null
            email: emailTrim, 
            password: hashedPassword, 
            role: normalizedRole 
        });
        
        const token = jwt.sign(
            { id: newUser.id, role: newUser.role, nombre: newUser.nombre }, 
            getJWTSecret(), 
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        res.status(201).json({ 
            token, 
            user: { 
                id: newUser.id, 
                nombre: newUser.nombre, 
                email: newUser.email, 
                role: newUser.role 
            } 
        });
    } catch (error) {
        console.error("Error en el registro:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error?.errors?.[0]?.path || 'dato';
            return res.status(409).json({ message: `El ${field} ya está en uso.` });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Error de validación", error: error.message });
        }
        res.status(500).json({ message: "Error al registrar", error: error.message });
    }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const User = db.User;

    // 1. Buscar al usuario por su email usando el modelo de Sequelize
    const user = await User.findOne({ where: { email } });

    // 2. VERIFICAR SI EXISTE EL USUARIO
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 3. VALIDAR CONTRASEÑA
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // 4. GENERAR TOKEN
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        nombre: user.nombre
      },
      getJWTSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 5. ENVIAR RESPUESTA AL FRONTEND
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};