import db from '../models/index.js';
const { Paciente } = db;

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Traer pacientes con los campos necesarios para evaluar alertas
    const pacientes = await Paciente.findAll({
      attributes: ['nombre', 'hba1c', 'imc', 'municipio', 'estatus', 'riesgo', 'ultimaVisita']
    });

    // --- Cálculos Matemáticos (Igual que antes) ---
    const totalPacientes = pacientes.length;
    const activos = pacientes.filter(p => p.estatus === 'Activo').length;

    let hba1cStats = { controlado: 0, riesgo: 0, sinControl: 0 };
    let imcStats = { normal: 0, sobrepeso: 0, obesidad: 0 };
    const municipiosMap = {};

    // --- NUEVO: Array para guardar las alertas específicas ---
    const alertas = [];

    pacientes.forEach(p => {
      // Stats HbA1c
      const hba1c = parseFloat(p.hba1c);
      if (!isNaN(hba1c)) {
        if (hba1c < 7) hba1cStats.controlado++;
        else if (hba1c >= 7 && hba1c < 9) hba1cStats.riesgo++;
        else {
            hba1cStats.sinControl++;
            // ALERTA 1: Glucosa muy alta
            alertas.push({
                id: p.id,
                nombre: p.nombre,
                tipo: 'Alta', // Rojo
                mensaje: `HbA1c crítica: ${hba1c}%`
            });
        }
      }

      // Stats IMC
      const imc = parseFloat(p.imc);
      if (!isNaN(imc)) {
        if (imc < 25) imcStats.normal++;
        else if (imc >= 25 && imc < 30) imcStats.sobrepeso++;
        else imcStats.obesidad++;
      }

      // Stats Municipios
      const muni = p.municipio || 'Otros';
      municipiosMap[muni] = (municipiosMap[muni] || 0) + 1;

      // ALERTA 2: Riesgo Alto asignado manualmente
      // Evitamos duplicados si ya entró por glucosa
      if (p.riesgo === 'Alto' && !alertas.find(a => a.nombre === p.nombre)) {
          alertas.push({
              id: p.id,
              nombre: p.nombre,
              tipo: 'Alta',
              mensaje: 'Paciente clasificado en Riesgo Alto'
          });
      }
    });

    // Ordenar municipios
    const municipiosSorted = Object.entries(municipiosMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    res.json({
      kpis: { total: totalPacientes, activos },
      hba1c: [hba1cStats.controlado, hba1cStats.riesgo, hba1cStats.sinControl],
      imc: [imcStats.normal, imcStats.sobrepeso, imcStats.obesidad],
      municipios: {
        labels: municipiosSorted.map(([k]) => k),
        data: municipiosSorted.map(([, v]) => v)
      },
      // Enviamos solo las últimas 3 alertas para no saturar el dashboard
      alertas: alertas.slice(0, 3) 
    });

  } catch (error) {
    console.error("Error dashboard:", error);
    res.status(500).json({ message: "Error server" });
  }
};