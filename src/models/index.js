import Sequelize from "sequelize";
import sequelize from "../config/database.js";

import defineUserModel from "./User.js";
import definePacienteModel from "./Paciente.js";
import defineCitaModel from "./Cita.js";
import Consulta from "./Consulta.js";
import defineCitasModel from "./Citas.js"; // ✅ nuevo: tabla `citas` (plural)
import Nutricion from "./Nutricion.js";
import PlanAlimentacion from "./PlanAlimentacion.js";
import Documento from "./Documento.js";
import PsicologiaSesion from "./PsicologiaSesion.js";
import PsicologiaEvaluacion from "./PsicologiaEvaluacion.js";
import PsicologiaObjetivo from "./PsicologiaObjetivo.js";
import PsicologiaEstrategia from "./PsicologiaEstrategia.js";
import PsicologiaNota from "./PsicologiaNota.js";

// ✅ 1) db DEBE existir antes de usarlo
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ✅ 2) Definir modelos
db.User = defineUserModel(sequelize, Sequelize);
db.Paciente = definePacienteModel(sequelize, Sequelize);
db.Cita = defineCitaModel(sequelize, Sequelize);   // normalmente tabla `cita`
db.Consulta = Consulta;
db.Citas = defineCitasModel(sequelize, Sequelize); // ✅ tabla `citas` (plural)
db.Nutricion = Nutricion;
db.PlanAlimentacion = PlanAlimentacion;
db.Documento = Documento;
db.PsicologiaSesion = PsicologiaSesion;
db.PsicologiaEvaluacion = PsicologiaEvaluacion;
db.PsicologiaObjetivo = PsicologiaObjetivo;
db.PsicologiaEstrategia = PsicologiaEstrategia;
db.PsicologiaNota = PsicologiaNota;

// ✅ 3) Relaciones (si aplican)
// (tus relaciones actuales están bien)
db.User.hasMany(db.Paciente, { foreignKey: "medicoId", as: "pacientesMedico" });
db.User.hasMany(db.Paciente, { foreignKey: "nutriologoId", as: "pacientesNutri" });
db.User.hasMany(db.Paciente, { foreignKey: "psicologoId", as: "pacientesPsy" });
db.User.hasMany(db.Paciente, { foreignKey: "podologoId", as: "pacientesPodologo" });
db.User.hasMany(db.Paciente, { foreignKey: "endocrinologoId", as: "pacientesEndocrino" });

db.Paciente.belongsTo(db.User, { foreignKey: "medicoId", as: "medico" });
db.Paciente.belongsTo(db.User, { foreignKey: "nutriologoId", as: "nutriologo" });
db.Paciente.belongsTo(db.User, { foreignKey: "psicologoId", as: "psicologo" });
db.Paciente.belongsTo(db.User, { foreignKey: "podologoId", as: "podologo" });
db.Paciente.belongsTo(db.User, { foreignKey: "endocrinologoId", as: "endocrinologo" });

export default db;


