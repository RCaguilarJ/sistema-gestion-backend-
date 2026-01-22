import db from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";



export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    // Si tu password NO está hasheado, cambia esta lógica (te digo abajo)
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user.id, role: user.role, nombre: user.nombre },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: { id: user.id, nombre: user.nombre, role: user.role, email: user.email },
    });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
