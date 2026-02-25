import sequelize from "../config/database.js";
import { DataTypes } from "sequelize";

const PsicologiaEstrategia = sequelize.define(
  "PsicologiaEstrategia",
  {
    pacienteId: { type: DataTypes.INTEGER, allowNull: false },
    psicologoId: { type: DataTypes.INTEGER, allowNull: true },
    estrategia: { type: DataTypes.STRING, allowNull: false },
    frecuencia: { type: DataTypes.STRING, allowNull: true },
    estado: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "psicologia_estrategias",
    timestamps: true,
  }
);

export default PsicologiaEstrategia;
