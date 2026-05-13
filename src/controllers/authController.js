import db from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getJWTSecret, JWT_EXPIRES_IN } from "../constants/config.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    // En produccion hay instalaciones con esquema viejo en `users`.
    // Para login solo se necesitan estas columnas.
    const user = await db.User.findOne({
      where: { email },
      attributes: ["id", "nombre", "email", "password", "role"],
      raw: true,
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (!user.password || typeof user.password !== "string") {
      console.error("login error: usuario sin password valido", { email });
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, nombre: user.nombre },
      getJWTSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
