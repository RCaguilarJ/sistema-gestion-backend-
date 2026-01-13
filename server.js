import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Base de datos (Solo Sequelize)
import db from './src/models/index.js';

// Rutas
import authRoutes from './src/routes/authRoutes.js';
import pacienteRoutes from './src/routes/pacienteRoutes.js';
import consultaRoutes from './src/routes/consultaRoutes.js';
import citaRoutes from './src/routes/citaRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import nutricionRoutes from './src/routes/nutricionRoutes.js';
import documentosRoutes from './src/routes/documentosRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js'; 
import amdSyncRoutes from './src/routes/amdSyncRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear carpeta uploads si no existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// CORS
const whitelistEnv = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5174';
const whitelist = whitelistEnv
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) callback(null, true);
    else callback(new Error('Bloqueado por CORS'));
  },
  credentials: true
}));

app.use(express.json({
  verify: (req, res, buf) => {
    if (buf?.length) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// --- CONEXIÓN ÚNICA MYSQL ---
// 'alter: true' es IMPORTANTE aquí para que cree las tablas nuevas automáticamente.
db.sequelize.sync({ alter: true }) 
  .then(() => console.log('✅ Sistema DB (MySQL) 100% Sincronizado'))
  .catch(err => console.error('❌ Error MySQL:', err));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nutricion', nutricionRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/sync/amd', amdSyncRoutes);
app.use('/api/notifications', notificationRoutes);



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo (Solo SQL) en http://localhost:${PORT}`);
});