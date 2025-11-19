// models/Cita.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Paciente from './Paciente.js';
import User from './User.js';

const Cita = sequelize.define('Cita', {
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Paciente,
      key: 'id',
    },
  },
  medicoId: { // Con quién tiene la cita (referencia al User)
    type: DataTypes.INTEGER,
    allowNull: false, // Asumimos que toda cita es con un médico/nutriólogo específico
    references: {
      model: User,
      key: 'id',
    },
  },
  fechaHora: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('Pendiente', 'Confirmada', 'Cancelada', 'Completada'),
    defaultValue: 'Pendiente',
    allowNull: false,
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'Citas',
});

// Definir las relaciones (Se definirán en models/index.js, pero las marcamos aquí)
// Cita.belongsTo(Paciente, { foreignKey: 'pacienteId' });
// Cita.belongsTo(User, { foreignKey: 'medicoId', as: 'Medico' });

export default Cita;