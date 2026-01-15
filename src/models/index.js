import Sequelize from 'sequelize';


import sequelize from '../config/database.js'; 



import defineUserModel from './User.js';
import definePacienteModel from './Paciente.js';
import defineCitaModel from './Cita.js';



const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;




db.User = defineUserModel(sequelize, Sequelize);
db.Paciente = definePacienteModel(sequelize, Sequelize);
db.Cita = defineCitaModel(sequelize, Sequelize);





db.User.hasMany(db.Paciente, { foreignKey: 'medicoId', as: 'pacientesMedico' });
db.User.hasMany(db.Paciente, { foreignKey: 'nutriologoId', as: 'pacientesNutri' });
db.User.hasMany(db.Paciente, { foreignKey: 'psicologoId', as: 'pacientesPsy' });
db.User.hasMany(db.Paciente, { foreignKey: 'podologoId', as: 'pacientesPodologo' });
db.User.hasMany(db.Paciente, { foreignKey: 'endocrinologoId', as: 'pacientesEndocrino' });

db.Paciente.belongsTo(db.User, { foreignKey: 'medicoId', as: 'medico' });
db.Paciente.belongsTo(db.User, { foreignKey: 'nutriologoId', as: 'nutriologo' });
db.Paciente.belongsTo(db.User, { foreignKey: 'psicologoId', as: 'psicologo' });
db.Paciente.belongsTo(db.User, { foreignKey: 'podologoId', as: 'podologo' });
db.Paciente.belongsTo(db.User, { foreignKey: 'endocrinologoId', as: 'endocrinologo' });

export default db;