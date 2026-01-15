import express from 'express';

const router = express.Router();

router.get('/todos', async (req, res) => {
  const doctorId = req.query.doctorId;
  try {
    // Pacientes locales
    const [pacientesLocales] = await db.query('SELECT * FROM pacientes WHERE doctor_id = ?', [doctorId]);
    // Pacientes externos
    const [pacientesExternos] = await db.query('SELECT * FROM usuarios WHERE doctor_id = ? AND activo = 1', [doctorId]);
    // Unir ambos resultados
    const todosLosPacientes = [...pacientesLocales, ...pacientesExternos];
    res.json(todosLosPacientes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pacientes', error });
  }
});

export default router;