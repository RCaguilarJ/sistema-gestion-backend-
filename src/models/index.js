import { Sequelize } from "sequelize";
// Ajusta la ruta de config según tu estructura. Si 'config' está en 'src/config':
import sequelize from "../config/database.js"; 

// --- 1. MODELOS ACTIVOS ---
import UserFactory from "./User.js";
import Paciente from "./Paciente.js";
import Cita from "./Cita.js";

// Initialize User model (since it's a factory function)
const User = UserFactory(sequelize);

// --- 2. RELACIONES ---
User.hasMany(Paciente, { foreignKey: "nutriologoId", as: "PacientesAsignados" });
Paciente.belongsTo(User, { foreignKey: "nutriologoId", as: "Nutriologo" });

// --- 3. EXPORTAR ---
const db = {
  sequelize,
  Sequelize,
  User,
  Paciente,
  Cita
};

export default db;