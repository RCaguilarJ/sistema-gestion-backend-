import express from "express";
import cors from "cors";
import db from "./config/database.js";

// --- Importar Modelos y Rutas ---
import User from "./models/User.js";
import Paciente from "./models/Paciente.js"; // <-- 1. AÑADIR IMPORT DEL MODELO
import authRoutes from "./routes/authRoutes.js";
import pacienteRoutes from "./routes/pacienteRoutes.js"; // <-- 2. AÑADIR IMPORT DE RUTA

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173" }));
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
    await db.sync(); // Esto ahora creará la tabla 'Users' Y 'Pacientes'
    console.log("✅ Modelos sincronizados con la base de datos.");

    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
  }
};

startServer();
