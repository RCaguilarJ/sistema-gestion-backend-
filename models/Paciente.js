// models/Paciente.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Paciente = sequelize.define('Paciente', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  curp: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  municipio: {
    type: DataTypes.STRING,
  },
  hba1c: {
    type: DataTypes.DECIMAL(4, 1), // Ej: 12.5
  },
  imc: {
    type: DataTypes.DECIMAL(4, 1), // Ej: 25.5
  },
  riesgo: {
    type: DataTypes.ENUM('Alto', 'Medio', 'Bajo'),
  },
  estatus: {
    type: DataTypes.ENUM('Activo', 'Inactivo'),
  },
  ultimaVisita: {
    type: DataTypes.DATE,
  },
  // (Aquí podemos añadir más campos como 'edad', 'genero', 'telefono', etc. después)
}, {
  // Opciones adicionales
  timestamps: true, // sequelize añadirá createdAt y updatedAt automáticamente
});

export default Paciente;