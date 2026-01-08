import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../models/index.js';

const router = express.Router();

router.get('/seed-admin', async (req, res) => {
  try {
    const adminEmail = 'admin@example.com';
    const User = db.User;

    // Verificar si el administrador ya existe
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      return res.status(400).json({ message: 'El usuario administrador ya existe.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash('password', 10); // Cambia 'password' por una contraseña segura

    // Crear el usuario administrador
    await User.create({
      nombre: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN', // Asegúrate de que este rol coincida con tu lógica de autorización
    });

    res.status(201).json({ message: 'Usuario administrador creado exitosamente.' });
  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

export default router;
