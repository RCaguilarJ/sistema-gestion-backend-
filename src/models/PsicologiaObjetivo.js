import sequelize from "../config/database.js";
import { DataTypes } from "sequelize";

const PsicologiaObjetivo = sequelize.define(
  "PsicologiaObjetivo",
  {
    pacienteId: { type: DataTypes.INTEGER, allowNull: false },
    psicologoId: { type: DataTypes.INTEGER, allowNull: true },
    objetivo: { type: DataTypes.TEXT, allowNull: false },
    progreso: { type: DataTypes.INTEGER, allowNull: true },
    tono: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "psicologia_objetivos",
    timestamps: true,
  }
);

export default PsicologiaObjetivo;
