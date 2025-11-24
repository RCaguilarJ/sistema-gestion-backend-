import db from '../models/index.js';
const { Paciente, Cita } = db; // <--- IMPORTANTE: Agregamos Cita

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Obtener datos de Pacientes
    const pacientes = await Paciente.findAll({
      attributes: ['nombre', 'hba1c', 'imc', 'municipio', 'estatus', 'riesgo']
    });

    // 2. Obtener datos de Citas para Adherencia
    const citas = await Cita.findAll({
      attributes: ['estado']
    });

    // --- CÁLCULOS PACIENTES ---
    const totalPacientes = pacientes.length;
    const activos = pacientes.filter(p => p.estatus === 'Activo').length;

    let hba1cStats = { controlado: 0, riesgo: 0, sinControl: 0 };
    let imcStats = { normal: 0, sobrepeso: 0, obesidad: 0 };
    const municipiosMap = {};
    const alertas = [];

    pacientes.forEach(p => {
      // HbA1c
      const hba1c = parseFloat(p.hba1c);
      if (!isNaN(hba1c)) {
        if (hba1c < 7) hba1cStats.controlado++;
        else if (hba1c >= 7 && hba1c < 9) hba1cStats.riesgo++;
        else {
            hba1cStats.sinControl++;
            alertas.push({
                id: p.id,
                nombre: p.nombre,
                tipo: 'Alta',
                mensaje: `HbA1c crítica: ${hba1c}%`
            });
        }
      }

      // IMC
      const imc = parseFloat(p.imc);
      if (!isNaN(imc)) {
        if (imc < 25) imcStats.normal++;
        else if (imc >= 25 && imc < 30) imcStats.sobrepeso++;
        else imcStats.obesidad++;
      }

      // Municipios
      const muni = p.municipio || 'Otros';
      municipiosMap[muni] = (municipiosMap[muni] || 0) + 1;

      // Alerta Riesgo Manual
      if (p.riesgo === 'Alto' && !alertas.find(a => a.nombre === p.nombre)) {
          alertas.push({
              id: p.id,
              nombre: p.nombre,
              tipo: 'Alta',
              mensaje: 'Paciente en Riesgo Alto'
          });
      }
    });

    // --- CÁLCULO ADHERENCIA (NUEVO) ---
    let citasAsistidas = 0;
    let citasTotalesPasadas = 0; // Completadas + Canceladas

    citas.forEach(c => {
        if (c.estado === 'Completada') {
            citasAsistidas++;
            citasTotalesPasadas++;
        } else if (c.estado === 'Cancelada') {
            citasTotalesPasadas++;
        }
    });

    // Evitamos división por cero
    const porcentajeAdherencia = citasTotalesPasadas > 0
        ? Math.round((citasAsistidas / citasTotalesPasadas) * 100)
        : 0; // Si no hay historial, empezamos en 0%

    // Ordenar municipios
    const municipiosSorted = Object.entries(municipiosMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    res.json({
      kpis: { total: totalPacientes, activos },
      adherencia: porcentajeAdherencia, // <--- DATO NUEVO
      hba1c: [hba1cStats.controlado, hba1cStats.riesgo, hba1cStats.sinControl],
      imc: [imcStats.normal, imcStats.sobrepeso, imcStats.obesidad],
      municipios: {
        labels: municipiosSorted.map(([k]) => k),
        data: municipiosSorted.map(([, v]) => v)
      },
      alertas: alertas.slice(0, 3)
    });

  } catch (error) {
    console.error("Error dashboard:", error);
    res.status(500).json({ message: "Error server" });
  }
};