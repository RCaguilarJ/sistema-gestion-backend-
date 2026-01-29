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

dotenv.config();

const app = express();

const allowedOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Body parser
app.use(express.json());

// CORS PRIMERO (antes de rutas)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) {
        return callback(new Error("CORS no configurado"), false);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origen no permitido por CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Archivos subidos
app.use("/uploads", express.static("uploads"));

// Preflight
app.options("*", cors());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/citas", citaRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/consultas", consultaRoutes);
app.use("/api/nutricion", nutricionRoutes);
app.use("/api/documentos", documentosRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check rápido
app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

