import db from '../models/index.js';
const { Paciente, Cita, PsicologiaSesion } = db; // <--- IMPORTANTE: Agregamos Cita

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

const roleToEspecialistaField = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "DOCTOR") return "medicoId";
  if (normalized === "NUTRI") return "nutriologoId";
  if (normalized === "PSICOLOGO" || normalized === "PSY") return "psicologoId";
  if (normalized === "ENDOCRINOLOGO") return "endocrinologoId";
  if (normalized === "PODOLOGO") return "podologoId";
  return null;
};

const buildMonthlyBuckets = (monthsBack = 5) => {
  const now = new Date();
  const buckets = [];

  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString('es-MX', { month: 'short' }),
      riskCount: 0,
      attended: 0,
      total: 0,
      stressSum: 0,
      stressCount: 0,
      adherenciaSum: 0,
      adherenciaCount: 0,
    });
  }

  return buckets;
};

const bucketByDate = (buckets, date) => {
  if (!date) return null;
  const key = `${date.getFullYear()}-${date.getMonth()}`;
  return buckets.find((b) => b.key === key) || null;
};

const categorizeMood = (value) => {
  if (!value) return 'Sin dato';
  const text = value.toString().toLowerCase();
  if (text.includes('ansio')) return 'Ansioso';
  if (text.includes('depri')) return 'Bajo';
  if (text.includes('estable') || text.includes('bien') || text.includes('tranq')) return 'Estable';
  return 'Otro';
};

const categorizeStress = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Sin dato';
  if (n <= 3) return 'Bajo';
  if (n <= 7) return 'Medio';
  return 'Alto';
};

export const getDashboardStats = async (req, res) => {
  try {
    const role = normalizeRole(req.user?.role);
    const userId = req.user?.id;
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const field = roleToEspecialistaField(role);

    const pacientesWhere = !isAdmin && field && userId ? { [field]: userId } : undefined;

    // 1. Obtener datos de Pacientes
    const pacientes = await Paciente.findAll({
      attributes: ['id', 'nombre', 'hba1c', 'imc', 'municipio', 'estatus', 'riesgo', 'ultimaVisita'],
      where: pacientesWhere,
    });

    // 2. Obtener datos de Citas para Adherencia
    const citasWhere = !isAdmin && userId && role === "DOCTOR" ? { medicoId: userId } : undefined;
    const citas = await Cita.findAll({
      attributes: ['estado', 'fechaHora'],
      where: citasWhere,
    });

    const sesionesPsico = role === "PSICOLOGO" || role === "PSY"
      ? await PsicologiaSesion.findAll({
          attributes: ['adherencia', 'estres', 'fecha', 'estadoAnimo'],
          where: { psicologoId: userId },
          order: [['fecha', 'DESC']],
        })
      : [];

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
    let porcentajeAdherencia = 0;
    if (sesionesPsico.length > 0) {
      const adherencias = sesionesPsico.map((s) => Number(s.adherencia)).filter((n) => Number.isFinite(n));
      porcentajeAdherencia = adherencias.length > 0
        ? Math.round(adherencias.reduce((a, b) => a + b, 0) / adherencias.length)
        : 0;
    } else {
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

      porcentajeAdherencia = citasTotalesPasadas > 0
          ? Math.round((citasAsistidas / citasTotalesPasadas) * 100)
          : 0; // Si no hay historial, empezamos en 0%
    }

    // Ordenar municipios
    const municipiosSorted = Object.entries(municipiosMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (sesionesPsico.length > 0) {
      sesionesPsico
        .filter((s) => Number(s.estres) >= 8)
        .slice(0, 3)
        .forEach((s, index) => {
          alertas.push({
            id: `estres-${index}`,
            nombre: "Sesion Psicologica",
            tipo: "Alta",
            mensaje: `Nivel de estres alto: ${s.estres}/10`,
          });
        });
    }

    if (role === "PSICOLOGO" || role === "PSY") {
      const moodCounts = {};
      const stressCounts = { Bajo: 0, Medio: 0, Alto: 0, 'Sin dato': 0 };
      const buckets = buildMonthlyBuckets(5);

      sesionesPsico.forEach((s) => {
        const mood = categorizeMood(s.estadoAnimo);
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;

        const stressLabel = categorizeStress(s.estres);
        stressCounts[stressLabel] = (stressCounts[stressLabel] || 0) + 1;

        const date = s.fecha ? new Date(s.fecha) : null;
        const bucket = bucketByDate(buckets, date);
        if (!bucket) return;
        if (Number(s.estres) >= 8) bucket.riskCount += 1;
        if (Number.isFinite(Number(s.estres))) {
          bucket.stressSum += Number(s.estres);
          bucket.stressCount += 1;
        }
        if (Number.isFinite(Number(s.adherencia))) {
          bucket.adherenciaSum += Number(s.adherencia);
          bucket.adherenciaCount += 1;
        }
      });

      const moodEntries = Object.entries(moodCounts);
      const moodLabels = moodEntries.map(([label]) => label);
      const moodData = moodEntries.map(([, value]) => value);

      const stressLabels = ['Bajo', 'Medio', 'Alto', 'Sin dato'];
      const stressData = stressLabels.map((label) => stressCounts[label]);

      return res.json({
        kpis: { total: totalPacientes, activos },
        adherencia: porcentajeAdherencia,
        hba1c: { labels: moodLabels, data: moodData },
        imc: { labels: stressLabels, data: stressData },
        municipios: {
          labels: municipiosSorted.map(([k]) => k),
          data: municipiosSorted.map(([, v]) => v)
        },
        tendencias: {
          labels: buckets.map((bucket) => bucket.label),
          riesgo: buckets.map((bucket) => bucket.riskCount),
          adherencia: buckets.map((bucket) => bucket.adherenciaCount > 0 ? Math.round(bucket.adherenciaSum / bucket.adherenciaCount) : 0),
        },
        alertas: alertas.slice(0, 5)
      });
    }

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

