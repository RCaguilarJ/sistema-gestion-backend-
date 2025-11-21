import { Sequelize } from "sequelize";
import sequelize from "../config/database.js";

// Importar modelos
import User from "./User.js";
import Paciente from "./Paciente.js";
import Consulta from "./Consulta.js";
import Nutricion from "./Nutricion.js";
import Documento from "./Documento.js";

// Definir relaciones

// Un usuario (nutriólogo) puede tener muchos pacientes
User.hasMany(Paciente, {
  foreignKey: "nutriologoId",
  as: "PacientesAsignados",
});

// Cada paciente pertenece a un usuario (nutriólogo)
Paciente.belongsTo(User, {
  foreignKey: "nutriologoId",
  as: "Nutriologo",
});

// Un paciente puede tener muchas consultas
Paciente.hasMany(Consulta, {
  foreignKey: "pacienteId",
  as: "Consultas",
});

// Cada consulta pertenece a un paciente
Consulta.belongsTo(Paciente, {
  foreignKey: "pacienteId",
  as: "Paciente",
});

// Un paciente puede tener un registro nutricional
Paciente.hasOne(Nutricion, {
  foreignKey: "pacienteId",
  as: "Nutricion",
});

// Un paciente puede tener muchos documentos
Paciente.hasMany(Documento, {
  foreignKey: "pacienteId",
  as: "Documentos",
});

// Exportar todos los modelos y la instancia de sequelize
const db = {
  sequelize,
  Sequelize,
  User,
  Paciente,
  Consulta,
  Nutricion,
  Documento,
};

export default db;
