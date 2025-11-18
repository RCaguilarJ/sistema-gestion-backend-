// models/Paciente.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Paciente = sequelize.define('Paciente', {
  // --- Datos Generales (image_c2c7e7.png) ---
  s: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  curp: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  fechaNacimiento: {
    type: DataTypes.DATEONLY, // Solo guarda 'YYYY-MM-DD'
  },
  genero: {
    type: DataTypes.ENUM('Masculino', 'Femenino', 'Otro'),
  },
  telefono: {
    type: DataTypes.STRING(15),
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true,
    },
  },
  
  // --- Domicilio (image_c2c808.png) ---
  calleNumero: {
    type: DataTypes.STRING,
  },
  colonia: {
    type: DataTypes.STRING,
  },
  municipio: {
    type: DataTypes.STRING,
  },
  estado: {
    type: DataTypes.STRING,
  },
  codigoPostal: {
    type: DataTypes.STRING(10),
  },

  // --- Datos Clínicos (image_c2c825.png) ---
  tipoDiabetes: {
    type: DataTypes.ENUM('Tipo 1', 'Tipo 2', 'Gestacional', 'Otro'),
  },
  fechaDiagnostico: {
    type: DataTypes.DATEONLY,
  },
  estaturaCm: {
    type: DataTypes.INTEGER, // Guardar en centímetros
  },
  pesoKg: {
    type: DataTypes.DECIMAL(5, 1), // Ej: 120.5 kg
  },
  // (Nota: IMC y HbA1c ya estaban)
  hba1c: {
    type: DataTypes.DECIMAL(4, 1), // Ej: 12.5
  },
  imc: {
    type: DataTypes.DECIMAL(4, 1), // Ej: 25.5
  },

  // --- Configuración (image_c2c841.png) ---
  estatus: {
    type: DataTypes.ENUM('Activo', 'Inactivo'),
    defaultValue: 'Activo',
  },
  riesgo: {
    type: DataTypes.ENUM('Alto', 'Medio', 'Bajo'),
  },
  programa: {
    type: DataTypes.STRING,
  },
  tipoTerapia: {
    type: DataTypes.STRING,
  },

  // (Campo del figma anterior que no está en el nuevo, pero lo dejamos)
  ultimaVisita: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: true, // sequelize añadirá createdAt y updatedAt
});

export default Paciente;