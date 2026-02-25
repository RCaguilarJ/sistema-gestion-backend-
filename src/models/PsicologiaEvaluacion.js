import sequelize from "../config/database.js";
import { DataTypes } from "sequelize";

const PsicologiaEvaluacion = sequelize.define(
  "PsicologiaEvaluacion",
  {
    pacienteId: { type: DataTypes.INTEGER, allowNull: false },
    psicologoId: { type: DataTypes.INTEGER, allowNull: true },
    titulo: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    ansiedadScore: { type: DataTypes.STRING, allowNull: true },
    ansiedadNivel: { type: DataTypes.STRING, allowNull: true },
    depresionScore: { type: DataTypes.STRING, allowNull: true },
    depresionNivel: { type: DataTypes.STRING, allowNull: true },
    autoeficaciaScore: { type: DataTypes.STRING, allowNull: true },
    autoeficaciaNivel: { type: DataTypes.STRING, allowNull: true },
    estrategias: { type: DataTypes.TEXT, allowNull: true },
    notas: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "psicologia_evaluaciones",
    timestamps: true,
  }
);

export default PsicologiaEvaluacion;
