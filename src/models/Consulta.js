import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Consulta = sequelize.define("Consulta", {
  motivo: { type: DataTypes.STRING, allowNull: false },
  hallazgos: { type: DataTypes.TEXT, allowNull: true },
  tratamiento: { type: DataTypes.TEXT, allowNull: true },
  pesoKg: { type: DataTypes.FLOAT, allowNull: true },
  hba1c: { type: DataTypes.FLOAT, allowNull: true },
  fechaConsulta: { type: DataTypes.DATE, allowNull: false },
  pacienteId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "consultas" });

export default Consulta; // Exportación por defecto para simplificar index.js