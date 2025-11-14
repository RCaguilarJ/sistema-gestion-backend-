// models/User.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Importamos la conexión
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
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
  // (Podríamos añadir 'role', 'confirmed', 'blocked' aquí, 
  // pero empecemos simple)
}, {
  // --- ¡Magia Aquí! ---
  // Hooks son funciones que se ejecutan automáticamente
  hooks: {
    // Antes de que un nuevo usuario sea creado (beforeCreate)...
    beforeCreate: async (user) => {
      // Encriptamos la contraseña
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    },
  },
});

export default User;