import db from "../models/index.js";
import bcrypt from "bcryptjs";

const { User } = db;

// Crear nuevo usuario (Solo ADMIN)
export const createUser = async (req, res) => {
  try {
    const { nombre, username, email, role, password } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Faltan campos requeridos: nombre, email, password" });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    // Verificar username si se proporciona
    if (username) {
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(409).json({ message: "El nombre de usuario ya existe" });
      }
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el usuario
    const newUser = await User.create({
      nombre,
      username: username || email, // Si no hay username, usar email
      email,
      password: hashedPassword,
      role: role || 'Paciente', // Rol por defecto
      estatus: 'Activo'
    });

    // Retornar sin contraseña
    const { password: _, ...userWithoutPassword } = newUser.toJSON();
    
    res.status(201).json({ 
      message: "Usuario creado exitosamente", 
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ message: "Error al crear usuario", error: error.message });
  }
};

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// Actualizar Usuario (Rol, Estatus, Datos)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, username, email, role, estatus, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar campos
    if (nombre) user.nombre = nombre;
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (estatus) user.estatus = estatus;
    
    // Si envían contraseña nueva, la encriptamos
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({ message: "Usuario actualizado correctamente", user });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

// Eliminar Usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Evitar que el admin se borre a sí mismo (Opcional de seguridad)
    if (req.user.id === user.id) {
        return res.status(400).json({ message: "No puedes eliminar tu propia cuenta de administrador." });
    }

    await user.destroy();
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};