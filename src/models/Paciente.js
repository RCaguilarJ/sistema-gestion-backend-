import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Paciente = sequelize.define('Paciente', {
  // --- Datos Personales ---
  nombre: { type: DataTypes.STRING, allowNull: false },
  curp: { type: DataTypes.STRING, allowNull: false, unique: true },
  fechaNacimiento: { type: DataTypes.DATEONLY },
  genero: { type: DataTypes.ENUM('Masculino', 'Femenino', 'Otro') },
  
  // --- Contacto ---
  telefono: { type: DataTypes.STRING(15) }, // Teléfono fijo (Opcional)
  celular: { type: DataTypes.STRING(15) },  // ¡NUEVO! (Requerido en tu formulario)
  email: { 
    type: DataTypes.STRING, 
    validate: { isEmail: true } 
  },
  
  // --- Domicilio ---
  calleNumero: { type: DataTypes.STRING },
  colonia: { type: DataTypes.STRING },
  municipio: { type: DataTypes.STRING },
  estado: { type: DataTypes.STRING },
  codigoPostal: { type: DataTypes.STRING(10) },

  // --- Programa y Servicio (¡SECCIÓN NUEVA!) ---
  grupo: { type: DataTypes.STRING },          // Antes usábamos 'programa', ahora 'grupo' para ser específicos
  tipoServicio: { type: DataTypes.STRING },   // Médico, Nutricional, Mixto
  tipoTerapia: { type: DataTypes.STRING },    // Individual, Grupal
  responsable: { type: DataTypes.STRING },    // Tutor o responsable
  motivoConsulta: { type: DataTypes.TEXT },   // Texto largo

  // --- Datos Clínicos y Fechas ---
  tipoDiabetes: { type: DataTypes.ENUM('Tipo 1', 'Tipo 2', 'Gestacional', 'Otro') },
  fechaDiagnostico: { type: DataTypes.DATEONLY },
  mesEstadistico: { type: DataTypes.STRING }, // Enero, Febrero...
  primeraVez: { type: DataTypes.BOOLEAN, defaultValue: true }, // Checkbox
  
  // Métricas físicas
  estaturaCm: { type: DataTypes.INTEGER },
  pesoKg: { type: DataTypes.DECIMAL(5, 1) },
  hba1c: { type: DataTypes.DECIMAL(4, 1) },
  imc: { type: DataTypes.DECIMAL(4, 1) },

  // --- Configuración Interna ---
  estatus: { 
    type: DataTypes.ENUM('Activo', 'Inactivo'), 
    defaultValue: 'Activo' 
  },
  riesgo: { type: DataTypes.ENUM('Alto', 'Medio', 'Bajo') },
  
  nutriologoId: { type: DataTypes.INTEGER, allowNull: true },
  ultimaVisita: { type: DataTypes.DATE },
}, {
  timestamps: true,
});

export default Paciente;