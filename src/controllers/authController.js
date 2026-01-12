// CORRECCIÓN: ../models
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const allowedRoles = [
    "ADMIN",
    "DOCTOR",
    "NUTRI",
    "PSY",
    "PATIENT",
    "ENDOCRINOLOGO",
    "PODOLOGO",
    "PSICOLOGO"
];

const JWT_SECRET = process.env.JWT_SECRET || "secreto_temporal";

export const register = async (req, res) => {
    // ... (mismo código lógico, solo importa las correcciones de arriba) ...
    // Copia el contenido lógico que tenías, pero asegúrate de que el import sea "../models/User.js"
    try {
        const { nombre, username, email, password, role } = req.body;

        if (!nombre || !username || !email || !password) return res.status(400).json({message: "Faltan datos"});
        const emailTrim = email.trim().toLowerCase();
        const usernameTrim = username.trim();

        if (await User.findOne({ where: { email: emailTrim } })) return res.status(409).json({ message: "Email registrado" });
        if (await User.findOne({ where: { username: usernameTrim } })) return res.status(409).json({ message: "Username registrado" });

        const normalizedRole = role && allowedRoles.includes(role) ? role : "DOCTOR";

        const newUser = await User.create({ 
            nombre, username: usernameTrim, email: emailTrim, password, role: normalizedRole 
        });
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: "24h" });
        res.status(201).json({ token, user: newUser });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error?.errors?.[0]?.path || 'dato';
            return res.status(409).json({ message: `El ${field} ya está en uso.` });
        }
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    // ... Asegúrate del import correcto ...
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email: email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};