import Nutricion from "../models/Nutricion.js";

export const getNutricion = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const info = await Nutricion.findOne({ pacienteId });
        res.json(info || { imc: "", estado: "", nutriologo: "", planes: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateNutricion = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { imc, nutriologo, estado } = req.body;

        const info = await Nutricion.findOneAndUpdate(
            { pacienteId },
            { imc, nutriologo, estado, updatedAt: Date.now() },
            { new: true, upsert: true }
        );
        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addPlan = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { nombre, fecha, detalles } = req.body;

        const info = await Nutricion.findOne({ pacienteId });
        if (!info) {
            return res.status(404).json({ error: "Información nutricional no encontrada" });
        }

        info.planes.push({ nombre, fecha, detalles });
        await info.save();

        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
