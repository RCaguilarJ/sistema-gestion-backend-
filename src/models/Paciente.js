import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Paciente = sequelize.define('Paciente', {
  // ... (Otros campos iguales: nombre, curp, fechas, etc.) ...
  nombre: { type: DataTypes.STRING, allowNull: false },
  curp: { type: DataTypes.STRING, allowNull: false, unique: true },
  fechaNacimiento: { type: DataTypes.DATEONLY },
  genero: { type: DataTypes.ENUM('Masculino', 'Femenino', 'Otro') },
  telefono: { type: DataTypes.STRING(15) },
  celular: { type: DataTypes.STRING(15) },
  email: { type: DataTypes.STRING, validate: { isEmail: true } },
  
  // Domicilio
  calleNumero: { type: DataTypes.STRING },
  colonia: { type: DataTypes.STRING },
  municipio: { type: DataTypes.STRING },
  estado: { type: DataTypes.STRING },
  codigoPostal: { type: DataTypes.STRING(10) },

  // Programa
  grupo: { type: DataTypes.STRING },
  tipoServicio: { type: DataTypes.STRING },
  tipoTerapia: { type: DataTypes.STRING },
  responsable: { type: DataTypes.STRING },
  motivoConsulta: { type: DataTypes.TEXT },

  // --- CAMBIO AQUÍ: ESTATURA EN METROS ---
  estatura: { 
    type: DataTypes.DECIMAL(3, 2), // Permite 1.65, 1.80, etc.
    allowNull: true 
  },
  // Eliminamos estaturaCm

  pesoKg: { type: DataTypes.DECIMAL(5, 1) },
  hba1c: { type: DataTypes.DECIMAL(4, 1) },
  imc: { type: DataTypes.DECIMAL(4, 1) },

  tipoDiabetes: { type: DataTypes.ENUM('Tipo 1', 'Tipo 2', 'Gestacional', 'Otro') },
  fechaDiagnostico: { type: DataTypes.DATEONLY },
  mesEstadistico: { type: DataTypes.STRING },
  primeraVez: { type: DataTypes.BOOLEAN, defaultValue: true },
  
  estatus: { type: DataTypes.ENUM('Activo', 'Inactivo'), defaultValue: 'Activo' },
  riesgo: { type: DataTypes.ENUM('Alto', 'Medio', 'Bajo') },
  nutriologoId: { type: DataTypes.INTEGER, allowNull: true },
  ultimaVisita: { type: DataTypes.DATE },
}, {
  timestamps: true,
});

export default Paciente;