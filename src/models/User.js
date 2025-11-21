import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcryptjs";

const User = sequelize.define("User", {
    nombre: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("ADMIN", "DOCTOR", "NUTRI", "PSY", "PATIENT"), defaultValue: "DOCTOR" },
    estatus: { type: DataTypes.ENUM("Activo", "Inactivo"), defaultValue: "Activo" },
  },
  {
    hooks: {
      beforeCreate: async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
    },
  }
);
export default User;