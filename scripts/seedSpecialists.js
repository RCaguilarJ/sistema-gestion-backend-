import 'dotenv/config';
import db from '../src/models/index.js';

const { User, sequelize } = db;

const SPECIALIST_ROLES = [
  {
    role: 'ENDOCRINOLOGO',
    nombre: 'Endocrinólogo Demo',
    username: 'endo_demo',
    email: 'endo.demo@sistemamedico.local',
    password: 'EndoDemo123*'
  },
  {
    role: 'PODOLOGO',
    nombre: 'Podólogo Demo',
    username: 'podo_demo',
    email: 'podo.demo@sistemamedico.local',
    password: 'PodoDemo123*'
  },
  {
    role: 'PSICOLOGO',
    nombre: 'Psicólogo Demo',
    username: 'psico_demo',
    email: 'psico.demo@sistemamedico.local',
    password: 'PsicoDemo123*'
  }
];

async function upsertSpecialist({ nombre, username, email, password, role }) {
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: { nombre, username, password, role, estatus: 'Activo' }
  });

  if (!created && user.role !== role) {
    user.role = role;
    user.username = username;
    await user.save();
  }

  return { user, created };
}

async function main() {
  try {
    await sequelize.authenticate();

    for (const specialist of SPECIALIST_ROLES) {
      const { user, created } = await upsertSpecialist(specialist);
      const action = created ? 'creado' : 'actualizado';
      console.log(`Usuario ${action}: ${user.email} -> ${user.role}`);
    }
  } catch (error) {
    console.error('Error al sembrar especialistas:', error);
  } finally {
    await sequelize.close();
  }
}

main();
