import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
      // Estos valores deben coincidir EXACTAMENTE con tu base de datos
      type: DataTypes.ENUM('ADMIN', 'SUPER_ADMIN', 'DOCTOR', 'NUTRI', 'PSY', 'PATIENT', 'ENDOCRINOLOGO', 'PODOLOGO', 'PSICOLOGO'),
      allowNull: false,
      defaultValue: 'DOCTOR'
    },
    estatus: {
      type: DataTypes.ENUM('Activo', 'Inactivo'),
      defaultValue: 'Activo'
    }
  }, {
    tableName: 'users', // Forza el nombre exacto de la tabla en MySQL
    timestamps: true    // Espera columnas createdAt y updatedAt
  });

  return User;
};