import { Sequelize } from "sequelize";
import sequelize from "../config/database.js";

// Importar modelos
import User from "./User.js";
import Paciente from "./Paciente.js";
import Consulta from "./Consulta.js";
import Cita from "./Cita.js";
// Nuevos modelos SQL
import Documento from "./Documento.js";
import Nutricion from "./Nutricion.js";
import PlanAlimentacion from "./PlanAlimentacion.js";

// --- RELACIONES ---

// Usuarios y Pacientes
User.hasMany(Paciente, { foreignKey: "nutriologoId", as: "PacientesAsignados" });
Paciente.belongsTo(User, { foreignKey: "nutriologoId", as: "Nutriologo" });

// Paciente -> Consultas
Paciente.hasMany(Consulta, { foreignKey: "pacienteId", as: "Consultas" });
Consulta.belongsTo(Paciente, { foreignKey: "pacienteId", as: "Paciente" });

// Paciente -> Citas
Paciente.hasMany(Cita, { foreignKey: "pacienteId", as: "Citas" });
Cita.belongsTo(Paciente, { foreignKey: "pacienteId", as: "Paciente" });

// Usuario -> Citas
User.hasMany(Cita, { foreignKey: "medicoId", as: "CitasMedicas" });
Cita.belongsTo(User, { foreignKey: "medicoId", as: "Medico" });

// --- NUEVAS RELACIONES (Reemplazando Mongo) ---

// Paciente -> Documentos
Paciente.hasMany(Documento, { foreignKey: "pacienteId", as: "Documentos" });
Documento.belongsTo(Paciente, { foreignKey: "pacienteId", as: "Paciente" });

// Paciente -> Nutrición (1 a 1)
Paciente.hasOne(Nutricion, { foreignKey: "pacienteId", as: "NutricionInfo" });
Nutricion.belongsTo(Paciente, { foreignKey: "pacienteId", as: "Paciente" });

// Paciente -> Planes de Alimentación (1 a muchos)
Paciente.hasMany(PlanAlimentacion, { foreignKey: "pacienteId", as: "PlanesNutricionales" });
PlanAlimentacion.belongsTo(Paciente, { foreignKey: "pacienteId", as: "Paciente" });

const db = {
  sequelize,
  Sequelize,
  User,
  Paciente,
  Consulta,
  Cita,
  Documento,
  Nutricion,
  PlanAlimentacion
};

export default db;