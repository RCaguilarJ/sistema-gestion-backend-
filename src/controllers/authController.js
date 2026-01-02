// // CORRECCIÓN: ../models
// import User from "../models/User.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET || "secreto_temporal";

// export const register = async (req, res) => {
//     // ... (mismo código lógico, solo importa las correcciones de arriba) ...
//     // Copia el contenido lógico que tenías, pero asegúrate de que el import sea "../models/User.js"
//     try {
//         const { nombre, username, email, password, role } = req.body;
//         // ... resto del código ...
//         // Para ahorrar espacio, asumo que copias el cuerpo de la función que ya tenías.
//         // Lo único CRÍTICO es la primera línea: import User from "../models/User.js";

//         // Te pongo el bloque mínimo para que funcione si copias y pegas:
//         if (!nombre || !username || !email || !password) return res.status(400).json({message: "Faltan datos"});
//         const emailTrim = email.trim().toLowerCase();
//         if (await User.findOne({ where: { email: emailTrim } })) return res.status(409).json({ message: "Email registrado" });

//         const newUser = await User.create({
//             nombre, username, email: emailTrim, password, role: role || "DOCTOR"
//         });
//         const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: "24h" });
//         res.status(201).json({ token, user: newUser });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// export const login = async (req, res) => {
//     // ... Asegúrate del import correcto ...
//     try {
//         const { email, password } = req.body;
//         const user = await User.findOne({ where: { email: email } });
//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             return res.status(401).json({ message: "Credenciales inválidas" });
//         }
//         const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
//         res.status(200).json({ token, user });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// Archivo: src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js'; // Asegúrate de importar tu modelo

const User = db.User; 

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar al usuario
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 2. VALIDAR CONTRASEÑA (Compatible con PHP)
    // bcryptjs.compare detecta automáticamente si el hash viene de PHP ($2y$)
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // 3. Generar Token
    const token = jwt.sign(
      { id: user.id, role: user.role, nombre: user.nombre },
      process.env.JWT_SECRET || 'secreto',
      { expiresIn: '8h' }
    );

    res.json({ token, user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// D. El Registro (Para que PHP también entienda al nuevo usuario)
export const register = async (req, res) => {
  try {
    const { nombre, email, password, role } = req.body;
    
    // Encriptar compatible con PHP (10 rounds es el estándar web)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      nombre,
      email,
      password: hashedPassword,
      role: role || 'usuario'
    });

    res.status(201).json({ message: 'Usuario creado', userId: newUser.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar', error: error.message });
  }
};