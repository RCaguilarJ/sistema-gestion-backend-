import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Carga condicional de variables de entorno
// Debe estar aquí porque los imports de ES modules se ejecutan
// antes que el código top-level de server.js
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config({ path: ".env.local" });
}
dotenv.config(); // fallback a .env (no sobreescribe)

const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASS, 
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT || 3306, 
    logging: false,
    timezone: '-06:00' 
  }
);

export default sequelize;