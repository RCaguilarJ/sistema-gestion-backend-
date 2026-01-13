import { DataTypes } from 'sequelize';

<<<<<<< HEAD
const User = sequelize.define("User", {
    nombre: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("ADMIN", "DOCTOR", "NUTRI", "PSY", "PATIENT", "ENDOCRINOLOGO", "PODOLOGO", "PSICOLOGO"), defaultValue: "DOCTOR" },
    estatus: { type: DataTypes.ENUM("Activo", "Inactivo"), defaultValue: "Activo" },
  },
  {
    hooks: {
      beforeCreate: async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
=======
export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
>>>>>>> 7b3ff6ba8231b0ba67ff0482d876ff4cec9cc648
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
      type: DataTypes.ENUM('Administrador', 'Doctor', 'Nutriólogo', 'Psicólogo', 'Paciente'),
      allowNull: false,
      defaultValue: 'Paciente'
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
