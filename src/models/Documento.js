import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Documento = sequelize.define('Documento', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  categoria: { type: DataTypes.STRING },
  cargadoPor: { type: DataTypes.STRING },
  tamano: { type: DataTypes.INTEGER }, // En bytes
  url: { type: DataTypes.STRING, allowNull: false },
  pacienteId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'documentos',
  timestamps: true
});

export default Documento;