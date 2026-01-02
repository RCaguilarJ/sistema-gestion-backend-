// // import { DataTypes } from "sequelize";
// // import sequelize from "../config/database.js";
// // import bcrypt from "bcryptjs";

// // const User = sequelize.define("User", {
// //     nombre: { type: DataTypes.STRING, allowNull: false },
// //     username: { type: DataTypes.STRING, allowNull: false, unique: true },
// //     email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
// //     password: { type: DataTypes.STRING, allowNull: false },
// //     role: { type: DataTypes.ENUM("ADMIN", "DOCTOR", "NUTRI", "PSY", "PATIENT"), defaultValue: "DOCTOR" },
// //     estatus: { type: DataTypes.ENUM("Activo", "Inactivo"), defaultValue: "Activo" },
// //   },
// //   {
// //     hooks: {
// //       beforeCreate: async (user) => {
// //         const salt = await bcrypt.genSalt(10);
// //         user.password = await bcrypt.hash(user.password, salt);
// //       },
// //     },
// //   }
// // );
// // export default User;

// // Archivo: src/models/User.js
// import { DataTypes } from 'sequelize';

// export default (sequelize) => {
//   const User = sequelize.define('User', {
//     // Definimos las columnas EXACTAS que tiene la tabla 'usuarios'
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true
//     },
//     nombre: {
//       type: DataTypes.STRING,
//       allowNull: false
//     },
//     email: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true
//     },
//     password: {
//       type: DataTypes.STRING,
//       allowNull: false
//     },
//     role: {
//       type: DataTypes.STRING,
//       defaultValue: 'usuario' // Valor por defecto para compatibilidad
//     },
//     username: {
//       type: DataTypes.STRING,
//       allowNull: true
//     }
//   }, {
//     tableName: 'usuarios', // <--- ¡CRÍTICO! Obliga a usar la tabla de PHP
//     timestamps: false      // <--- ¡CRÍTICO! Si la tabla de PHP no tiene createdAt/updatedAt, pon esto en false o fallará.
//   });

//   return User;
// };

// Archivo: src/models/User.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('User', {
    // Definimos las columnas EXACTAS que tiene la tabla 'usuarios'
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'usuario' // Valor por defecto para compatibilidad
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'usuarios', // <--- ¡CRÍTICO! Obliga a usar la tabla de PHP
    timestamps: false      // <--- ¡CRÍTICO! Si la tabla de PHP no tiene createdAt/updatedAt, pon esto en false o fallará.
  });

  return User;
};