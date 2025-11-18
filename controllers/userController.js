import User from "../models/User.js";

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    // Buscamos todos los usuarios
    const users = await User.findAll({
      // ¡IMPORTANTE! Excluimos la contraseña por seguridad.
      // No queremos enviar hashes de contraseñas al frontend.
      attributes: { exclude: ["password"] },
    });

    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      message: "Error al obtener usuarios",
      error: error.message,
    });
  }
};

// (Aquí podrías añadir más funciones en el futuro, como deleteUser o updateUser)
