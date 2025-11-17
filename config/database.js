// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuramos la conexión a la base de datos MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME || 'sistema_gestion_medica', // 1. Nombre de la base de datos
  process.env.DB_USER || 'root',                   // 2. Usuario
  process.env.DB_PASSWORD || '',                   // 3. Contraseña
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false, // Desactivar logs de SQL en consola
  }
);

export default sequelize;