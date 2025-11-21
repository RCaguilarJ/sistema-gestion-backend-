// models/Consulta.js
import { DataTypes } from "sequelize";
import db from "../config/database.js";

const Consulta = db.define("Consulta", {
  motivo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hallazgos: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tratamiento: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pesoKg: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  hba1c: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  fechaConsulta: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: "consultas",
  timestamps: true,
});

export { Consulta };