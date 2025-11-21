import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cita = sequelize.define('Cita', {
  fechaHora: { type: DataTypes.DATE, allowNull: false },
  motivo: { type: DataTypes.STRING, allowNull: false },
  notas: { type: DataTypes.TEXT },
  estado: { 
    type: DataTypes.ENUM('Pendiente', 'Confirmada', 'Cancelada', 'Completada'), 
    defaultValue: 'Pendiente' 
  },
  pacienteId: { type: DataTypes.INTEGER, allowNull: false },
  medicoId: { type: DataTypes.INTEGER, allowNull: false }
});

export default Cita;