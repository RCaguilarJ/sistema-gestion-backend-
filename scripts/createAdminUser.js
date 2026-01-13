import 'dotenv/config';
import db from '../src/models/index.js';
import { Op } from 'sequelize';

const { User, sequelize } = db;

async function createAdmin({ nombre, username, email, password }) {
  await sequelize.authenticate();

  const existing = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }]
    }
  });
  if (existing) {
    console.log(`Usuario administrador ya existe con email ${existing.email} o username ${existing.username} (ID ${existing.id}).`);
    return existing;
  }

  const user = await User.create({
    nombre,
    username,
    email,
    password,
    role: 'ADMIN',
    estatus: 'Activo'
  });

  console.log(`Usuario administrador creado con ID ${user.id}.`);
  return user;
}

async function main() {
  const [nombreArg, usernameArg, emailArg, passwordArg] = process.argv.slice(2);

  const nombre = nombreArg || 'Administrador General';
  const username = usernameArg || 'admin';
  const email = emailArg || 'admin@sistemamedico.local';
  const password = passwordArg || 'Admin123*';

  try {
    await createAdmin({ nombre, username, email, password });
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
  } finally {
    await sequelize.close();
  }
}

main();
