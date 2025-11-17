import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/database.js";

// Cargar variables de entorno
dotenv.config();

// --- Importar Modelos y Rutas ---
import User from "./models/User.js";
import Paciente from "./models/Paciente.js"; // <-- 1. AÑADIR IMPORT DEL MODELO
import authRoutes from "./routes/authRoutes.js";
import pacienteRoutes from "./routes/pacienteRoutes.js"; // <-- 2. AÑADIR IMPORT DE RUTA

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// --- Conectar las Rutas ---
app.use("/api/auth", authRoutes);
app.use("/api/pacientes", pacienteRoutes); // <-- 3. AÑADIR RUTA AL SERVIDOR

app.get("/api", (req, res) => {
  res.json({ message: "¡API del Sistema de Gestión Médica funcionando!" });
});

// --- Sincronizar la Base de Datos y Arrancar ---
const startServer = async () => {
  try {
    await db.authenticate();
    console.log("✅ Conexión a la base de datos establecida correctamente.");
    
    await db.sync(); // Esto ahora creará la tabla 'Users' Y 'Pacientes'
    console.log("✅ Modelos sincronizados con la base de datos.");
  } catch (error) {
    console.warn("⚠️  Advertencia: No se pudo conectar a la base de datos:", error.message);
    console.warn("⚠️  El servidor se iniciará sin conexión a la base de datos.");
    console.warn("⚠️  Las operaciones que requieran la base de datos fallarán.");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  });
};

startServer();
