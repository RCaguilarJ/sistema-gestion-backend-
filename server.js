import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

// ============================================================
// CARGA DE VARIABLES DE ENTORNO (condicional)
// ============================================================
// 1. Si NODE_ENV=production → carga .env.production
// 2. Si no → carga .env.local (desarrollo)
// 3. Fallback a .env (no sobreescribe las ya cargadas)
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config({ path: ".env.local" });
}
dotenv.config(); // fallback a .env (no sobreescribe variables ya definidas)

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
  process.env.FRONTEND_URLS || process.env.APP_URL || ""
);

const corsOptions = {
  origin: (origin, callback) => {
    // Si no hay origin (peticiones server-to-server), permitir
    if (!origin) return callback(null, true);

    // En desarrollo, permitir todo
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0) {
      // Si no hay orígenes configurados, permitir todo
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Origen no permitido
    console.log("CORS: Origen no permitido:", origin);
    return callback(new Error("No permitido por CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ============================================================
// MIDDLEWARES GLOBALES
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use("/uploads", express.static("uploads"));
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

// Health check (útil para verificar que el servidor está corriendo)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ============================================================
// MANEJO DE ERRORES 404
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ============================================================
// MANEJO DE ERRORES GLOBAL
// ============================================================
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0"; // Escuchar en todas las interfaces

app.listen(PORT, HOST, () => {
  console.log(
    `Servidor corriendo en http://${HOST}:${PORT} (NODE_ENV: ${process.env.NODE_ENV})`
  );
});
