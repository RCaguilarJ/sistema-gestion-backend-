// models/index.js
import sequelize from '../config/database.js';
import User from './User.js';
import Paciente from './Paciente.js';
import Consulta from './Consulta.js'; // Importar
import Cita from './Cita.js';         // Importar

// --- 1. Definición de Relaciones ---

// A. Relaciones de User con Paciente/Consulta/Cita
// Un User puede ser el Nutriólogo de muchos Pacientes
User.hasMany(Paciente, { foreignKey: 'nutriologoId', as: 'PacientesAsignados' });
Paciente.belongsTo(User, { foreignKey: 'nutriologoId', as: 'Nutriologo' });

// Un User puede crear muchas Consultas
User.hasMany(Consulta, { foreignKey: 'medicoId', as: 'ConsultasRealizadas' });
Consulta.belongsTo(User, { foreignKey: 'medicoId', as: 'Medico' });

// Un User puede tener muchas Citas
User.hasMany(Cita, { foreignKey: 'medicoId', as: 'CitasAsignadas' });
Cita.belongsTo(User, { foreignKey: 'medicoId', as: 'Medico' });


// B. Relaciones de Paciente con Consulta/Cita (1:M)
// Un Paciente tiene muchas Consultas (Historial)
Paciente.hasMany(Consulta, { foreignKey: 'pacienteId', as: 'Consultas' });
Consulta.belongsTo(Paciente, { foreignKey: 'pacienteId' });

// Un Paciente tiene muchas Citas
Paciente.hasMany(Cita, { foreignKey: 'pacienteId', as: 'Citas' });
Cita.belongsTo(Paciente, { foreignKey: 'pacienteId' });


// --- 2. Sincronización ---
// Nota: La sincronización (sync) debe estar solo en el archivo principal (index.js o server.js)
// Por ahora, solo exportamos los modelos y el objeto sequelize
const db = {
  sequelize,
  User,
  Paciente,
  Consulta,
  Cita,
};

export default db;