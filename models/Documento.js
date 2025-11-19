// models/Documento.js
import mongoose from 'mongoose';

const DocumentoSchema = new mongoose.Schema({
    pacienteId: { type: mongoose.Types.ObjectId, ref: 'Paciente', required: true },
    nombre: { type: String, required: true },
    categoria: { type: String },
    fecha: { type: Date, default: Date.now },
    cargadoPor: { type: String },
    tamano: { type: Number },
    url: { type: String, required: true }
});

export default mongoose.model('Documento', DocumentoSchema);
