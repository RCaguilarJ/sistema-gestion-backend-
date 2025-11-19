import sequelize from '../config/database.js';
import User from './User.js';
import Paciente from './Paciente.js';

// Relaciones (User <-> Paciente)
User.hasMany(Paciente, { foreignKey: 'nutriologoId', as: 'PacientesAsignados' });
Paciente.belongsTo(User, { foreignKey: 'nutriologoId', as: 'Nutriologo' });

// Exportar un objeto centralizado con la instancia y modelos
const db = {
  sequelize,
  User,
  Paciente,
};

export default db;