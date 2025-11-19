// models/Consulta.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Paciente from './Paciente.js'; // Importar Paciente para la relación
import User from './User.js';       // Importar User para la relación Médico/Nutriólogo

const Consulta = sequelize.define('Consulta', {
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Paciente,
      key: 'id',
    },
  },
  medicoId: { // Quién realizó la consulta (referencia al User)
    type: DataTypes.INTEGER,
    allowNull: true, // Puede ser nulo si se registra un historial antiguo sin médico conocido
    references: {
      model: User,
      key: 'id',
    },
  },
  fechaConsulta: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Por defecto, es la fecha actual
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  hallazgos: {
    type: DataTypes.TEXT, // Para notas detalladas
    allowNull: true,
  },
  tratamiento: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pesoKg: {
    type: DataTypes.DECIMAL(5, 1), // Peso registrado en esa consulta
    allowNull: true,
  },
  hba1c: {
    type: DataTypes.DECIMAL(4, 1), // Nivel de HbA1c registrado en esa consulta
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'Consultas',
});

// Definir las relaciones (Se definirán en models/index.js, pero las marcamos aquí)
// Consulta.belongsTo(Paciente, { foreignKey: 'pacienteId' });
// Consulta.belongsTo(User, { foreignKey: 'medicoId', as: 'Medico' });

export default Consulta;