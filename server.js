import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Importación de tus rutas (Asegúrate de que los archivos existan en estas rutas)
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

// Configuración de __dirname para ES Modules
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
dotenv.config(); // Fallback a .env estándar

const app = express();

// ============================================================
// CONFIGURACIÓN DE CORS
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
  // IMPORTANTE: Incluimos X-Signature y X-Source para la sincronización de citas
  allowedHeaders: ["Content-Type", "Authorization", "X-Signature", "X-Source"],
  optionsSuccessStatus: 200
};

// ============================================================
// MIDDLEWARES GLOBALES
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Manejo explícito de Preflight para todas las rutas
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

// Health check para verificar el estado en el VPS
app.get("/api/health", (req, res) => {
  res.json({ 
    ok: true, 
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString() 
  });
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
// Usamos el puerto 4000 que es el configurado en tu .htaccess del VPS
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