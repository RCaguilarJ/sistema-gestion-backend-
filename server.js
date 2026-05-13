import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Importacion de tus rutas (Asegurate de que los archivos existan en estas rutas)
import authRoutes from "./src/routes/authRoutes.js";
import pacienteRoutes from "./src/config/routes/routes/pacienteRoutes.js";
import citaRoutes from "./src/routes/citaRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import consultaRoutes from "./src/routes/consultaRoutes.js";
import nutricionRoutes from "./src/routes/nutricionRoutes.js";
import documentosRoutes from "./src/routes/documentosRoutes.js";
import userRoutes from "./src/config/routes/routes/userRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import psicologiaRoutes from "./src/routes/psicologiaRoutes.js";
import db from "./src/models/index.js";

// Configuracion de __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CARGA DE VARIABLES DE ENTORNO
// ============================================================
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config({ path: ".env.local" });
}
dotenv.config(); // Fallback a .env estandar

const app = express();

// ============================================================
// CONFIGURACION DE CORS
// ============================================================
const parseAllowedOrigins = (value) =>
  (value || "")
    .split(/[\n,;]+/)
    .map((o) => o.trim())
    .filter(Boolean);

const allowedOrigins = parseAllowedOrigins(
  process.env.FRONTEND_URLS || "https://amdj.desingsgdl.app"
);

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (server-to-server como tu App PHP)
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("CORS: Origen no permitido:", origin);
    return callback(new Error("No permitido por CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Importante: incluimos headers de sincronizacion
  allowedHeaders: ["Content-Type", "Authorization", "X-Signature", "X-Source"],
  optionsSuccessStatus: 200,
};

// ============================================================
// MIDDLEWARES GLOBALES
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Manejo explicito de Preflight para todas las rutas
app.options("*", cors(corsOptions));

// ============================================================
// RUTAS DE LA API
// ============================================================
app.use("/api/auth", authRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/citas", citaRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/consultas", consultaRoutes);
app.use("/api/nutricion", nutricionRoutes);
app.use("/api/psicologia", psicologiaRoutes);
app.use("/api/documentos", documentosRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check real: proceso + acceso a base de datos
app.get("/api/health", async (req, res) => {
  try {
    await db.sequelize.authenticate();
    return res.json({
      ok: true,
      env: process.env.NODE_ENV,
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check DB error:", error.message);
    return res.status(503).json({
      ok: false,
      env: process.env.NODE_ENV,
      database: "down",
      error: "Database unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================
// MANEJO DE ERRORES
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada en el servidor AMDJ" });
});

app.use((err, req, res, next) => {
  console.error("Error detectado:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
// Puerto definido por entorno; si no existe, usamos 4000
const PORT = process.env.PORT || 4000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`
   SERVIDOR CORRIENDO
  Dominio: https://amdj.desingsgdl.app
  Puerto local: ${PORT}
  Entorno: ${process.env.NODE_ENV}
  `);
});
