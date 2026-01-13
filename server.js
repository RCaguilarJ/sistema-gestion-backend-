import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Base de datos
import db from './src/models/index.js';

// --- RUTAS ACTIVAS ---
import authRoutes from './src/routes/authRoutes.js';
import pacienteRoutes from './src/routes/pacienteRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

// --- RUTAS PENDIENTES (Descomentar cuando crees los archivos en src/routes) ---
// Si los dejas activos sin tener los archivos, el servidor explota.
import consultaRoutes from './src/routes/consultaRoutes.js';
import citaRoutes from './src/routes/citaRoutes.js';
import nutricionRoutes from './src/routes/nutricionRoutes.js';
import documentosRoutes from './src/routes/documentosRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js'; 
import amdSyncRoutes from './src/routes/amdSyncRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';

import { BASE_URL } from './src/utils/url.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear carpeta uploads si no existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}


// --- CORS CONFIGURADO PARA MÚLTIPLES PUERTOS ---
// Permite acceso desde diferentes puertos de desarrollo de Vite
app.use(cors({
  origin: [
    'http://localhost:5173', // Puerto por defecto de Vite
    'http://localhost:5174', // Puerto alternativo de Vite
    'http://localhost:3000', // Puerto alternativo
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// --- CONEXIÓN BASE DE DATOS ---
db.sequelize.sync()
  .then(() => console.log('✅ Sistema DB (MySQL) 100% Sincronizado'))
  .catch(err => console.error('❌ Error MySQL:', err));

// --- USAR RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/users', userRoutes);

// Descomentar estas líneas cuando descomentes los imports de arriba
app.use('/api/consultas', consultaRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/nutricion', nutricionRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/sync/amd', amdSyncRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // Si BASE_URL da error, imprimimos localhost
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});