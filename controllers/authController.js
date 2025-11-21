import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ⚠️ Recomendación: usa dotenv para manejar secretos
const JWT_SECRET = process.env.JWT_SECRET || "mi-secreto-muy-seguro-para-tokens";

// --- REGISTRO DE USUARIO ---
export const register = async (req, res) => {
  try {
    const { nombre, username, email, password, role } = req.body;

    // Validaciones básicas
    if (!nombre || !username || !email || !password) {
      return res.status(400).json({
        message: "Faltan campos requeridos: nombre, username, email o password",
      });
    }

    const emailTrim = email.trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(emailTrim)) {
      return res.status(400).json({ message: "Email inválido" });
    }

    const userExists = await User.findOne({ where: { email: emailTrim } });
    if (userExists) {
      return res.status(409).json({ message: "El correo ya está registrado." });
    }

    const allowedRoles = ["ADMIN", "DOCTOR", "NUTRI", "PSY", "PATIENT"];
    const finalRole = allowedRoles.includes(role) ? role : "DOCTOR";

    const newUser = await User.create({
      nombre: nombre.trim(),
      username: username.trim(),
      email: emailTrim,
      password: password.trim(), // bcrypt se aplica en el modelo
      role: finalRole,
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

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
    console.error("Error en register:", error);

    if (error.name === "SequelizeValidationError") {
      const details = error.errors.map((e) => e.message);
      return res.status(400).json({ message: "Validation error", details });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      const details = error.errors.map((e) => e.message);
      return res.status(409).json({ message: "Constraint error", details });
    }

    res.status(500).json({ message: "Error en el servidor", details: error.message });
  }
};

// --- LOGIN DE USUARIO ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Faltan campos: email o password" });
    }

    const emailTrim = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: emailTrim } });
    if (!user) {
      return res.status(401).json({ message: "Correo electrónico o contraseña incorrectas." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Correo electrónico o contraseña incorrectas." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

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
    res.status(500).json({ message: "Error en el servidor", details: error.message });
  }
};
