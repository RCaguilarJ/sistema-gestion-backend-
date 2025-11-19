// controllers/nutricionController.js
import Nutricion from '../models/Nutricion.js';

export const getNutricion = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const info = await Nutricion.findOne({ pacienteId });
        if (!info) {
            return res.json({ imc: null, nutriologo: '', estado: '', planes: [] });
        }
        res.json(info);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener información nutricional' });
    }
};

export const updateNutricion = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { imc, nutriologo, estado } = req.body;

        const updated = await Nutricion.findOneAndUpdate(
            { pacienteId },
            { imc, nutriologo, estado, updatedAt: Date.now() },
            { new: true, upsert: true }
        );
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar información nutricional' });
    }
};

export const addPlan = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const plan = req.body; // { nombre, fecha, detalles }

        const nutricion = await Nutricion.findOne({ pacienteId });
        if (!nutricion) {
            // Crear nuevo documento si no existe
            const newNutricion = await Nutricion.create({
                pacienteId,
                planes: [plan]
            });
            return res.json(newNutricion);
        }

        nutricion.planes.push(plan);
        nutricion.updatedAt = Date.now();
        await nutricion.save();

        res.json(nutricion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al agregar plan nutricional' });
    }
};
