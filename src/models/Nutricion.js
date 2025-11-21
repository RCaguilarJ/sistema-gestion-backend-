import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Nutricion = sequelize.define('Nutricion', {
  imc: { type: DataTypes.FLOAT },
  nutriologo: { type: DataTypes.STRING },
  estado: { type: DataTypes.STRING },
  pacienteId: { type: DataTypes.INTEGER, allowNull: false, unique: true }, // 1 a 1
}, {
  tableName: 'nutricion_info',
  timestamps: true
});

export default Nutricion;