import bcrypt from 'bcryptjs';
import db from './src/models/index.js';

const resetAdminPassword = async () => {
  try {
    const adminEmail = 'admin@admin.com';
    const newPassword = 'admin123';
    const User = db.User;

    console.log(`Buscando al usuario administrador con email: ${adminEmail}...`);
    let adminUser = await User.findOne({ where: { email: adminEmail } });

    if (!adminUser) {
      console.log('No existe el usuario admin. Creando uno nuevo...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      adminUser = await User.create({
        nombre: 'Administrador',
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        estatus: 'Activo'
      });
      console.log(' Usuario admin creado: admin@admin.com / admin123');
    } else {
      console.log('Usuario encontrado. Generando nueva contraseña...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log('¡Éxito! La contraseña del administrador ha sido actualizada a "admin123".');
    }
  } catch (error) {
    console.error('Ocurrió un error al intentar resetear la contraseña:', error);
  } finally {
    await db.sequelize.close();
  }
};

resetAdminPassword();
