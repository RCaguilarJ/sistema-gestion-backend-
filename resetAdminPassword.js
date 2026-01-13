import bcrypt from 'bcryptjs';
import db from './src/models/index.js';

const resetAdminPassword = async () => {
  try {
    const adminEmail = 'admin@test.com';
    const newPassword = 'admin123';

    console.log(`Buscando al usuario administrador con email: ${adminEmail}...`);
    const User = db.User;
    const adminUser = await User.findOne({ where: { email: adminEmail } });

    if (!adminUser) {
      console.error('¡Error! No se encontró al usuario administrador.');
      return;
    }

    console.log('Usuario encontrado. Generando nueva contraseña...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('Actualizando la contraseña en la base de datos...');
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('¡Éxito! La contraseña del administrador ha sido actualizada a "admin123".');

  } catch (error) {
    console.error('Ocurrió un error al intentar resetear la contraseña:', error);
  } finally {
    await db.sequelize.close();
  }
};

resetAdminPassword();
