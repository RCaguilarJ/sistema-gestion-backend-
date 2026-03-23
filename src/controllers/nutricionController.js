import db from '../models/index.js';
import { ADMIN_VIEW_ROLES } from '../constants/roles.js';
import { normalizeTallaInput } from '../utils/pacienteFields.js';
const { Nutricion, PlanAlimentacion, Paciente } = db;

const parseInteger = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeRole = (value) => {
  if (!value) return null;
  return value
    .toString()
    .trim()
    .toUpperCase()
    .replace("Ã“", "O")
    .replace("Ã", "I")
    .replace("Ã", "A")
    .replace("Ã‰", "E")
    .replace("Ãš", "U");
};

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const text = value.toString().trim();
  if (!text) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/");
    return new Date(`${year}-${month}-${day}`);
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ensurePacienteAccess = async (req, pacienteId) => {
  const role = normalizeRole(req.user?.role);
  const userId = parseInteger(req.user?.id);
  const isAdmin = ADMIN_VIEW_ROLES.includes(role);
  if (isAdmin) return true;
  if (!userId) return false;

  const paciente = await Paciente.findByPk(pacienteId, {
    attributes: [
      "id",
      "usuarioId",
      "medicoId",
      "nutriologoId",
      "psicologoId",
      "endocrinologoId",
      "podologoId",
    ],
  });
  if (!paciente) return false;

  if (role === "PATIENT") return paciente.usuarioId === userId;

  const fieldMap = {
    DOCTOR: "medicoId",
    NUTRI: "nutriologoId",
    PSY: "psicologoId",
    PSICOLOGO: "psicologoId",
    ENDOCRINOLOGO: "endocrinologoId",
    PODOLOGO: "podologoId",
  };

  const field = fieldMap[role];
  if (!field) return false;
  return paciente[field] === userId;
};

export const getNutricion = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const id = parseInteger(pacienteId);
        if (!id) return res.status(400).json({ error: "pacienteId invalido" });

        const allowed = await ensurePacienteAccess(req, id);
        if (!allowed) return res.status(403).json({ error: "No autorizado" });
        
        // 1. Buscar Info General
        const [info, paciente] = await Promise.all([
          Nutricion.findOne({ where: { pacienteId: id } }),
          Paciente.findByPk(id, {
            attributes: [
              'id',
              'talla',
              'estatura',
              'programa',
              'campana',
              'tipoMembresia',
              'estadoPago',
            ],
          }),
        ]);
        
        // 2. Buscar Planes
        const planes = await PlanAlimentacion.findAll({ 
            where: { pacienteId: id },
            order: [['fecha', 'DESC']]
        });

        // 3. Combinar respuesta para que el Frontend no se rompa
        res.json({
            imc: info?.imc || "",
            estado: info?.estado || "",
            nutriologo: info?.nutriologo || "",
            talla: paciente?.talla || "",
            estatura: paciente?.estatura || "",
            programa: paciente?.programa || "",
            campana: paciente?.campana || "",
            tipoMembresia: paciente?.tipoMembresia || "",
            estadoPago: paciente?.estadoPago || "",
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
        const id = parseInteger(pacienteId);
        if (!id) return res.status(400).json({ error: "pacienteId invalido" });

        const allowed = await ensurePacienteAccess(req, id);
        if (!allowed) return res.status(403).json({ error: "No autorizado" });

        const { imc, nutriologo, estado, talla, estatura, programa, campana, tipoMembresia, estadoPago } = req.body;

        // Buscar si existe, si no, crear
        const [paciente, existingInfo] = await Promise.all([
          Paciente.findByPk(id),
          Nutricion.findOne({ where: { pacienteId: id } }),
        ]);
        if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

        const pacienteUpdates = {};
        if (talla !== undefined) pacienteUpdates.talla = normalizeTallaInput(talla);
        if (estatura !== undefined) pacienteUpdates.estatura = estatura;
        if (programa !== undefined) pacienteUpdates.programa = programa;
        if (campana !== undefined) pacienteUpdates.campana = campana;
        if (tipoMembresia !== undefined) pacienteUpdates.tipoMembresia = tipoMembresia;
        if (estadoPago !== undefined) pacienteUpdates.estadoPago = estadoPago;

        let info = existingInfo;

        if (info) {
            await info.update({ imc, nutriologo, estado });
        } else {
            info = await Nutricion.create({ pacienteId: id, imc, nutriologo, estado });
        }

        if (Object.keys(pacienteUpdates).length > 0) {
          await paciente.update(pacienteUpdates);
        }

        res.json({
          ...info.toJSON(),
          talla: paciente.talla,
          estatura: paciente.estatura,
          programa: paciente.programa,
          campana: paciente.campana,
          tipoMembresia: paciente.tipoMembresia,
          estadoPago: paciente.estadoPago,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addPlan = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const id = parseInteger(pacienteId);
        if (!id) return res.status(400).json({ error: "pacienteId invalido" });

        const allowed = await ensurePacienteAccess(req, id);
        if (!allowed) return res.status(403).json({ error: "No autorizado" });

        const { nombre, fecha, detalles } = req.body;
        const fechaParsed = parseDate(fecha);

        if (!nombre) return res.status(400).json({ error: "nombre requerido" });
        if (!fechaParsed) return res.status(400).json({ error: "fecha invalida" });

        const nuevoPlan = await PlanAlimentacion.create({
            pacienteId: id,
            nombre,
            fecha: fechaParsed,
            detalles
        });

        res.json(nuevoPlan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePlan = async (req, res) => {
  try {
    const { pacienteId, planId } = req.params;
    const pId = parseInteger(pacienteId);
    const id = parseInteger(planId);
    if (!pId || !id) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const plan = await PlanAlimentacion.findOne({
      where: { id, pacienteId: pId },
    });
    if (!plan) return res.status(404).json({ error: "Plan no encontrado" });

    const updates = {};
    if (req.body?.nombre !== undefined) updates.nombre = req.body.nombre;
    if (req.body?.detalles !== undefined) updates.detalles = req.body.detalles;
    if (req.body?.fecha !== undefined) {
      const fechaParsed = parseDate(req.body.fecha);
      if (!fechaParsed) return res.status(400).json({ error: "fecha invalida" });
      updates.fecha = fechaParsed;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }

    await plan.update(updates);
    return res.json(plan);
  } catch (error) {
    console.error("Error actualizando plan:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { pacienteId, planId } = req.params;
    const pId = parseInteger(pacienteId);
    const id = parseInteger(planId);
    if (!pId || !id) return res.status(400).json({ error: "ids invalidos" });

    const allowed = await ensurePacienteAccess(req, pId);
    if (!allowed) return res.status(403).json({ error: "No autorizado" });

    const plan = await PlanAlimentacion.findOne({
      where: { id, pacienteId: pId },
    });
    if (!plan) return res.status(404).json({ error: "Plan no encontrado" });

    await plan.destroy();
    return res.json({ message: "Plan eliminado" });
  } catch (error) {
    console.error("Error eliminando plan:", error);
    return res.status(500).json({ error: error.message });
  }
};
