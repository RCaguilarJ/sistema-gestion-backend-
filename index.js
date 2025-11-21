import express from "express";
import cors from "cors";
import db from "./config/database.js";
import consultaRoutes from "./routes/consultaRoutes.js";



// --- 1. Importar Modelos ---
import User from "./models/User.js";
import Paciente from "./models/Paciente.js";

import nutricionRoutes from './routes/nutricionRoutes.js';
import documentosRoutes from './routes/documentosRoutes.js';

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

app.use('/api/nutricion', nutricionRoutes);

app.use('/api/documentos', documentosRoutes);


// --- 3. Conectar las Rutas ---
app.use("/api/auth", authRoutes);
app.use("/api/pacientes", pacienteRoutes);
// ¡NUEVO! Conectamos la ruta para que el frontend pueda pedir la lista
app.use("/api/users", userRoutes);
app.use("/api/consultas", consultaRoutes);



// Ruta base de prueba
app.get("/api", (req, res) => {
  res.json({ message: "¡API del Sistema de Gestión Médica funcionando!" });
});

// --- 4. Iniciar Servidor ---
const startServer = async () => {
  try {
    await db.authenticate();
    console.log("✅ Conexión a la base de datos establecida.");

    // Sincronizar modelos sin forzar cambios automáticos para evitar que MySQL
    // acumule índices duplicados en cada arranque.
    await db.sync();
    console.log("✅ Modelos sincronizados con la base de datos.");

    // Crear usuarios y pacientes de prueba solo si la tabla de usuarios está vacía
    const userCount = await User.count();
    if (userCount === 0) {
      const testUser = await User.create({
        nombre: "Administrador",
        username: "admin",
        email: "admin@test.com",
        password: "admin123",
        role: "ADMIN",
        estatus: "Activo",
      });
      console.log("✅ Usuario de prueba creado: admin@test.com / admin123");

      // Crear otros usuarios de prueba: nutriólogo y doctor
      const nutriUser = await User.create({
        nombre: "Nutriólogo",
        username: "nutri",
        email: "nutri@test.com",
        password: "nutri123",
        role: "NUTRI",
        estatus: "Activo",
      });

      const doctorUser = await User.create({
        nombre: "Doctor",
        username: "doctor",
        email: "doctor@test.com",
        password: "doctor123",
        role: "DOCTOR",
        estatus: "Activo",
      });

      console.log("✅ Usuarios de prueba creados: nutri@test.com / nutri123, doctor@test.com / doctor123");

      // Crear algunos pacientes asignados al nutriólogo
      await Paciente.create({ nombre: 'Paciente A', curp: 'CURP0001', nutriologoId: nutriUser.id });
      await Paciente.create({ nombre: 'Paciente B', curp: 'CURP0002', nutriologoId: nutriUser.id });
      await Paciente.create({ nombre: 'Paciente C', curp: 'CURP0003' });
      console.log('✅ Pacientes de prueba creados (dos asignados al nutriólogo)');
    } else {
      console.log('ℹ️ Usuarios de prueba ya existen — saltando creación de datos de ejemplo.');
    }

    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
  }
};

startServer();
