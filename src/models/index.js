import { Sequelize } from "sequelize";
// Ajusta la ruta de config según tu estructura. Si 'config' está en 'src/config':
import sequelize from "../config/database.js"; 

// --- 1. MODELOS ACTIVOS ---
import UserFactory from "./User.js";
import Paciente from "./Paciente.js";
import Cita from "./Cita.js";
import Consulta from "./Consulta.js";
// Nuevos modelos SQL
import Consulta from "./Consulta.js";
import Documento from "./Documento.js";
import Nutricion from "./Nutricion.js";
import PlanAlimentacion from "./PlanAlimentacion.js";
import Notification from "./Notification.js";

// Initialize User model (since it's a factory function)
const User = UserFactory(sequelize);

// --- 2. RELACIONES ---
User.hasMany(Paciente, { foreignKey: "nutriologoId", as: "PacientesAsignados" });
Paciente.belongsTo(User, { foreignKey: "nutriologoId", as: "Nutriologo" });

// Relaciones para Cita
Cita.belongsTo(User, { foreignKey: "pacienteId", as: "Paciente" });
Cita.belongsTo(User, { foreignKey: "medicoId", as: "Medico" });
User.hasMany(Cita, { foreignKey: "pacienteId", as: "CitasComoPaciente" });
User.hasMany(Cita, { foreignKey: "medicoId", as: "CitasComoMedico" });

// --- 3. EXPORTAR ---
const db = {
  sequelize,
  Sequelize,
  User,
  Paciente,
  Consulta,
  Cita,
  Documento,
  Nutricion,
  PlanAlimentacion,
  Notification
};

export default db;