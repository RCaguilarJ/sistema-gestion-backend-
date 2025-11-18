import express from "express";
import cors from "cors";
import db from "./config/database.js";

// --- 1. Importar Modelos ---
import User from "./models/User.js";
import Paciente from "./models/Paciente.js";

// --- 2. Importar Archivos de Rutas ---
import authRoutes from "./routes/authRoutes.js";
import pacienteRoutes from "./routes/pacienteRoutes.js";
// ¡NUEVO! Importamos la ruta de usuarios que acabamos de crear
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Configuración de CORS
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: corsOrigin }));

app.use(express.json());

// --- 3. Conectar las Rutas ---
app.use("/api/auth", authRoutes);
app.use("/api/pacientes", pacienteRoutes);
// ¡NUEVO! Conectamos la ruta para que el frontend pueda pedir la lista
app.use("/api/users", userRoutes);

// Ruta base de prueba
app.get("/api", (req, res) => {
  res.json({ message: "¡API del Sistema de Gestión Médica funcionando!" });
});

// --- 4. Iniciar Servidor ---
const startServer = async () => {
  try {
    await db.authenticate();
    console.log("✅ Conexión a la base de datos establecida.");

    // con las nuevas columnas (role, estatus, nombre).
    await db.sync({ force: true });
    console.log("✅ Modelos sincronizados con la base de datos.");

    // Crear usuario de prueba
    const testUser = await User.create({
      nombre: "Administrador",
      username: "admin",
      email: "admin@test.com",
      password: "admin123",
      role: "ADMIN",
      estatus: "Activo",
    });
    console.log("✅ Usuario de prueba creado: admin@test.com / admin123");

    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
  }
};

startServer();
