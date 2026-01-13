import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  titulo: { type: DataTypes.STRING, allowNull: false },
  mensaje: { type: DataTypes.TEXT, allowNull: false },
  tipo: { type: DataTypes.STRING, allowNull: true },
  rol_destino: { type: DataTypes.STRING, allowNull: true },
  especialidad_destino: { type: DataTypes.STRING, allowNull: true },
  referencia_tipo: { type: DataTypes.STRING, allowNull: true },
  referencia_id: { type: DataTypes.INTEGER, allowNull: true },
  leido: { type: DataTypes.BOOLEAN, defaultValue: false },
  creado_en: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'notifications',
  timestamps: false
});

export default Notification;
