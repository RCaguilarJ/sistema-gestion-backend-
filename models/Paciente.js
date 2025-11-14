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
    type: DataTypes.DECIMAL(4, 1),
  },
  imc: {
    type: DataTypes.DECIMAL(4, 1),
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
}, {
  timestamps: true,
});

export default Paciente;