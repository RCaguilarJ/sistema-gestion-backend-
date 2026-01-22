import { DataTypes } from 'sequelize';

// Eliminamos la importación de 'database.js' porque index.js nos pasará la conexión.

export default (sequelize) => {
  const Paciente = sequelize.define('Paciente', {
    // --- DATOS PERSONALES ---
    nombre: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    curp: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    fechaNacimiento: { type: DataTypes.DATEONLY },
    genero: { type: DataTypes.ENUM('Masculino', 'Femenino', 'Otro') },
    
    // --- CONTACTO ---
    telefono: { type: DataTypes.STRING(15) },
    celular: { type: DataTypes.STRING(15) },
    email: { 
      type: DataTypes.STRING, 
      validate: { isEmail: true } 
    },

    // --- DOMICILIO ---
    calleNumero: { type: DataTypes.STRING },
    colonia: { type: DataTypes.STRING },
    municipio: { type: DataTypes.STRING },
    estado: { type: DataTypes.STRING },
    codigoPostal: { type: DataTypes.STRING(10) },

    // --- PROGRAMA / ADMIN ---
    grupo: { type: DataTypes.STRING },
    tipoServicio: { type: DataTypes.STRING },
    tipoTerapia: { type: DataTypes.STRING },
    responsable: { type: DataTypes.STRING },
    motivoConsulta: { type: DataTypes.TEXT },
    mesEstadistico: { type: DataTypes.STRING },
    primeraVez: { type: DataTypes.BOOLEAN, defaultValue: true },
    estatus: { type: DataTypes.ENUM('Activo', 'Inactivo'), defaultValue: 'Activo' },

    // --- DATOS CLÍNICOS Y MÉTRICAS ---
    estatura: { 
      type: DataTypes.DECIMAL(3, 2), 
      allowNull: true 
    },
    pesoKg: { type: DataTypes.DECIMAL(5, 1) },
    hba1c: { type: DataTypes.DECIMAL(4, 1) },
    imc: { type: DataTypes.DECIMAL(4, 1) },
    tipoDiabetes: { type: DataTypes.ENUM('Tipo 1', 'Tipo 2', 'Gestacional', 'Otro') },
    fechaDiagnostico: { type: DataTypes.DATEONLY },
    riesgo: { type: DataTypes.ENUM('Alto', 'Medio', 'Bajo') },
    ultimaVisita: { type: DataTypes.DATE },

    // --- ASIGNACIÓN DE ESPECIALISTAS ---
    usuarioId: { 
      type: DataTypes.INTEGER,
      allowNull: false 
    },
    nutriologoId: { type: DataTypes.INTEGER, allowNull: true },
    medicoId: { type: DataTypes.INTEGER, allowNull: true },
    psicologoId: { type: DataTypes.INTEGER, allowNull: true },
    endocrinologoId: { type: DataTypes.INTEGER, allowNull: true },
    podologoId: { type: DataTypes.INTEGER, allowNull: true }

  }, {
    timestamps: true,
    tableName: 'pacientes'
  });

  return Paciente;
};
