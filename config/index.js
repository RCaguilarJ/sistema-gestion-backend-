// index.js (Principal del Backend)
import express from "express";
import cors from "cors";
// Importamos el objeto 'db' central que contiene la instancia de Sequelize (db.sequelize) y todos los modelos.
import db from './models/index.js'; 

// --- Importar Archivos de Rutas ---
import authRoutes from "./routes/authRoutes.js";
import pacienteRoutes from "./routes/pacienteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import consultaRoutes from "./routes/consultaRoutes.js"; // <--- NUEVA
import citaRoutes from "./routes/citaRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000; // Usa el puerto del entorno o 4000

// Configuración de CORS (asumiendo que usas dotenv para CORS_ORIGIN)
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: corsOrigin }));

// Middleware para que Express use JSON
app.use(express.json());

// --- Conectar las Rutas ---
app.use("/api/auth", authRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/consultas", consultaRoutes); // <--- CONEXIÓN
app.use("/api/citas", citaRoutes);

// Ruta base de prueba
app.get("/api", (req, res) => {
  res.json({ message: "¡API del Sistema de Gestión Médica funcionando!" });
});


// --- Lógica de Inicio de Servidor y Sincronización ---
const startServer = async () => {
  try {
    // 1. Verificar conexión a la base de datos
    await db.sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida.");

    // 2. Sincronizar modelos y crear/modificar tablas
    // { alter: true } crea las nuevas tablas (Consulta, Cita) y las columnas nuevas sin borrar datos.
    await db.sequelize.sync({ alter: true }); 
    console.log("✅ Modelos sincronizados con la base de datos. (Tablas Consultas y Citas añadidas/actualizadas)");

    // --- LÓGICA DE CREACIÓN DE USUARIOS DE PRUEBA ---
    // NOTA: Esta lógica creará nuevos usuarios si no existen, o fallará si ya tienes la restricción UNIQUE.
    // Solo se debe usar en un entorno de desarrollo.

    // Crearemos usuarios de prueba si la tabla User está vacía
    const userCount = await db.User.count();
    if (userCount === 0) {
        // Crear usuarios de prueba
        const testUser = await db.User.create({
            nombre: "Administrador",
            username: "admin",
            email: "admin@test.com",
            password: "admin123", // Se hashea automáticamente por el hook beforeCreate en tu modelo User.js
            role: "ADMIN",
            estatus: "Activo",
        });
        
        const nutriUser = await db.User.create({
            nombre: "Nutriólogo",
            username: "nutri",
            email: "nutri@test.com",
            password: "nutri123",
            role: "NUTRI",
            estatus: "Activo",
        });

        console.log("✅ Usuarios de prueba creados (ADMIN, NUTRI)");

        // Crear pacientes de prueba y asignarlos (usa db.Paciente)
        await db.Paciente.create({ 
            nombre: 'Paciente A', 
            curp: 'CURP0001', 
            nutriologoId: nutriUser.id,
            estatus: 'Activo',
            riesgo: 'Medio',
        });
        await db.Paciente.create({ 
            nombre: 'Paciente B', 
            curp: 'CURP0002', 
            nutriologoId: nutriUser.id, 
            estatus: 'Inactivo',
            riesgo: 'Alto',
        });
        console.log('✅ Pacientes de prueba creados.');
    }
    // ----------------------------------------------------


    // 3. Iniciar el servidor
    app.listen(PORT, () => {
        console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    // Asegúrate de que el error de conexión a la DB se muestre claramente
    if (error.name === 'SequelizeConnectionRefusedError' || error.name === 'SequelizeHostNotFoundError') {
        console.error("Verifique que su servidor WAMP/MySQL esté funcionando y la configuración en models/index.js sea correcta.");
    }
    process.exit(1);
  }
};

startServer();