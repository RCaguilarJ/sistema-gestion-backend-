import db from '../models/index.js';
const { Nutricion, PlanAlimentacion } = db;

export const getNutricion = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        
        // 1. Buscar Info General
        const info = await Nutricion.findOne({ where: { pacienteId } });
        
        // 2. Buscar Planes
        const planes = await PlanAlimentacion.findAll({ 
            where: { pacienteId },
            order: [['fecha', 'DESC']]
        });

        // 3. Combinar respuesta para que el Frontend no se rompa
        res.json({
            imc: info?.imc || "",
            estado: info?.estado || "",
            nutriologo: info?.nutriologo || "",
            planes: planes || []
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const updateNutricion = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { imc, nutriologo, estado } = req.body;

        // Buscar si existe, si no, crear
        let info = await Nutricion.findOne({ where: { pacienteId } });

        if (info) {
            await info.update({ imc, nutriologo, estado });
        } else {
            info = await Nutricion.create({ pacienteId, imc, nutriologo, estado });
        }

        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addPlan = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { nombre, fecha, detalles } = req.body;

        const nuevoPlan = await PlanAlimentacion.create({
            pacienteId,
            nombre,
            fecha,
            detalles
        });

        res.json(nuevoPlan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};