// models/User.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcryptjs";

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // --- ¡CAMBIO AQUÍ! ---
    // Añadimos la columna para guardar el rol del usuario.
    role: {
      type: DataTypes.ENUM("Administrador", "Doctor", "Nutriólogo"),
      allowNull: false,
      defaultValue: "Doctor", // Por defecto, creamos usuarios como 'Doctor'
    },
  },
  {
    hooks: {
      // Esto encripta la contraseña automáticamente antes de guardarla
      beforeCreate: async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
    },
  }
);

export default User;
