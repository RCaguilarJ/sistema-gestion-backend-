import sequelize from "../config/database.js";
import { DataTypes } from "sequelize";

const PsicologiaSesion = sequelize.define(
  "PsicologiaSesion",
  {
    pacienteId: { type: DataTypes.INTEGER, allowNull: false },
    psicologoId: { type: DataTypes.INTEGER, allowNull: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    estadoAnimo: { type: DataTypes.STRING, allowNull: true },
    adherencia: { type: DataTypes.INTEGER, allowNull: true },
    estres: { type: DataTypes.INTEGER, allowNull: true },
    intervenciones: { type: DataTypes.TEXT, allowNull: true },
    notas: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "psicologia_sesiones",
    timestamps: true,
  }
);

export default PsicologiaSesion;
