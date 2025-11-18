// controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Esta debería ser una variable de entorno secreta, pero la pondremos aquí por ahora
const JWT_SECRET = "mi-secreto-muy-seguro-para-tokens";

// --- FUNCIÓN DE REGISTRO (LA QUE FALTABA) ---
export const register = async (req, res) => {
  try {
    // 1. Obtenemos y validamos los campos del body
    const { nombre, username, email, password, role } = req.body;

    if (!nombre || !username || !email || !password) {
      return res.status(400).json({
        message: "Faltan campos requeridos: nombre, username, email o password",
      });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

    // 2. Sanitizar/normalizar el role entrante para evitar errores de ENUM en el modelo
    // Esperamos claves de rol estables desde el frontend
    const allowedRoles = ["ADMIN", "DOCTOR", "NUTRI", "PSY", "PATIENT"];
    const finalRole = allowedRoles.includes(role) ? role : "DOCTOR";

    // 3. Creamos el usuario (el hook en el modelo encripta la contraseña)
    const newUser = await User.create({
      nombre,
      username,
      email,
      password,
      role: finalRole,
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
        nombre: newUser.nombre,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    // Loguear el error completo en el servidor para depuración
    console.error("Error en register:", error);

    // Devolver un body con detalles mínimamente útiles para el frontend
    res
      .status(500)
      .json({ message: "Error en el servidor", details: error.message });
  }
};

// --- FUNCIÓN DE LOGIN (CORREGIDA) ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Faltan campos: email o password" });
    }

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
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Enviamos la respuesta (ahora incluye el rol)
    res.status(200).json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res
      .status(500)
      .json({ message: "Error en el servidor", details: error.message });
  }
};
