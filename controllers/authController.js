// controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Obtener el secreto JWT de las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || "mi-secreto-muy-seguro-para-tokens";

// --- FUNCIÓN DE REGISTRO (LA QUE FALTABA) ---
export const register = async (req, res) => {
  try {
    // 1. Obtenemos el 'role' del body
    const { username, email, password, role } = req.body;

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

    // 2. Pasamos el 'role' al crear el usuario
    const newUser = await User.create({
      username,
      email,
      password,
      role, // <-- ¡Añadido!
    });

    // 3. Creamos un token (ahora incluye el rol)
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4. Enviamos la respuesta (ahora incluye el rol)
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role, // <-- ¡Añadido!
      },
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    
    // Si el error es de conexión a la base de datos
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
      return res.status(503).json({ 
        message: "Servicio de base de datos no disponible. Por favor, intente más tarde.", 
        error: "Database connection failed" 
      });
    }
    
    res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};

// --- FUNCIÓN DE LOGIN (CORREGIDA) ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Creamos un token (ahora incluye el rol)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, // <-- ¡Rol añadido al token!
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Enviamos la respuesta (ahora incluye el rol)
    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role, // <-- ¡Rol añadido a la respuesta!
      },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    
    // Si el error es de conexión a la base de datos
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
      return res.status(503).json({ 
        message: "Servicio de base de datos no disponible. Por favor, intente más tarde.", 
        error: "Database connection failed" 
      });
    }
    
    res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};
