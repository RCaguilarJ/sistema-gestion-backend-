// config/database.js
import { Sequelize } from 'sequelize';

// Configuramos la conexión a la base de datos MySQL (WAMP)
const sequelize = new Sequelize(
  'sistema_gestion_medica', // 1. Nombre de la base de datos que creaste
  'root',                   // 2. Usuario (WAMP usa 'root' por defecto)
  '',                       // 3. Contraseña (WAMP usa '' (vacío) por defecto)
  {
    host: 'localhost',
    dialect: 'mysql' // 4. ¡Importante! Le decimos que use MySQL
  }
);

export default sequelize;