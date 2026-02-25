import sequelize from "../config/database.js";
import { DataTypes } from "sequelize";

const PsicologiaNota = sequelize.define(
  "PsicologiaNota",
  {
    pacienteId: { type: DataTypes.INTEGER, allowNull: false },
    psicologoId: { type: DataTypes.INTEGER, allowNull: true },
    nota: { type: DataTypes.TEXT, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: true },
  },
  {
    tableName: "psicologia_notas",
    timestamps: true,
  }
);

export default PsicologiaNota;
