// models/Nutricion.js
import mongoose from 'mongoose';

const PlanSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    fecha: { type: Date, required: true },
    detalles: { type: String } // o lo que necesites
});

const NutricionSchema = new mongoose.Schema({
    pacienteId: { type: mongoose.Types.ObjectId, ref: 'Paciente', required: true, unique: true },
    imc: { type: Number },
    nutriologo: { type: String },
    estado: { type: String },
    planes: { type: [PlanSchema], default: [] },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Nutricion', NutricionSchema);
