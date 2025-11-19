import User from "../models/User.js";

export const getAllUsers = async (req, res) => {
  try {
    // Buscamos todos los usuarios pero EXCLUIMOS la contraseña por seguridad
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener usuarios", error: error.message });
  }
};

// Aquí podrías agregar deleteUser, updateUser, etc.
