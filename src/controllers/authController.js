import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js'; // Acceso a la instancia de Sequelize

<<<<<<< HEAD
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
=======
// No necesitamos 'User' directamente para el login, usaremos SQL puro para traer todo junto
// const User = db.User; 
>>>>>>> 7b3ff6ba8231b0ba67ff0482d876ff4cec9cc648

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
    // Ya no necesitamos una consulta compleja de permisos, el rol está en el usuario.
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, // Usamos el campo 'role' directamente del modelo
        // Los permisos se pueden derivar del rol en el frontend si es necesario
      },
      process.env.JWT_SECRET || 'secreto',
      { expiresIn: '8h' }
    );

    // 5. ENVIAR RESPUESTA AL FRONTEND
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role, // Ej: "Administrador"
        // No enviamos un array de permisos explícito, el frontend usará el rol
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// El registro lo puedes dejar igual, usando el modelo estándar ya que es una inserción simple
export const register = async (req, res) => {
  try {
    const { nombre, email, password, role } = req.body;
    const User = db.User; // Aquí sí usamos el modelo
    
    const hashedPassword = await bcrypt.hash(password, 10);

    // Nota: Asegúrate de que tu modelo User tenga la columna 'role_id' definida
    // Si no, esto podría fallar. Por ahora asignamos un rol por defecto si es necesario.
    // Para simplificar, asumiremos que tu modelo aún usa el campo viejo o lo ignoramos por ahora.
    
    const newUser = await User.create({
      nombre,
      email,
      password: hashedPassword,
      role: role || 'usuario', // Asignar ID de Paciente por defecto, por ejemplo
    });

    res.status(201).json({ message: 'Usuario creado', userId: newUser.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar', error: error.message });
  }
};