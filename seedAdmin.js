import bcrypt from 'bcryptjs';
import db from './models/index.js';

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@example.com';
    const User = db.User;

    // Verificar si el administrador ya existe
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log('El usuario administrador ya existe.');
      return;
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

    console.log('Usuario administrador creado exitosamente.');
  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
  } finally {
    await db.sequelize.close();
  }
};

seedAdmin();
