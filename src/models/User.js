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
      type: DataTypes.ENUM('ADMIN', 'DOCTOR', 'NUTRI', 'PSY', 'PATIENT', 'ENDOCRINOLOGO', 'PODOLOGO', 'PSICOLOGO'),
      allowNull: false,
      defaultValue: 'PATIENT'
    },
    estatus: {
      type: DataTypes.ENUM('Activo', 'Inactivo'),
      defaultValue: 'Activo'
    }
  }, {
    tableName: 'users',
    timestamps: true // La tabla sí tiene createdAt y updatedAt
  });

  return User;
};
