import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PlanAlimentacion = sequelize.define('PlanAlimentacion', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  detalles: { type: DataTypes.TEXT },
  pacienteId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'planes_alimentacion',
  timestamps: true
});

export default PlanAlimentacion;