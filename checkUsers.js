import db from './src/models/index.js';

const checkAdminUsers = async () => {
  try {
    const User = db.User;
    
    // Buscar todos los usuarios admin
    const adminUsers = await User.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { email: { [db.Sequelize.Op.like]: '%admin%' } },
          { role: { [db.Sequelize.Op.like]: '%admin%' } }
        ]
      },
      attributes: ['id', 'nombre', 'email', 'role', 'estatus', 'createdAt']
    });

    console.log('Usuarios Admin encontrados:');
    console.log('================================');
    
    if (adminUsers.length === 0) {
      console.log('❌ No se encontraron usuarios admin');
    } else {
      adminUsers.forEach(user => {
        console.log(` Email: ${user.email}`);
        console.log(` Nombre: ${user.nombre}`);
        console.log(` Rol: ${user.role}`);
        console.log(` Estatus: ${user.estatus}`);
        console.log(` Creado: ${user.createdAt}`);
        console.log('-------------------');
      });
    }

    // Buscar específicamente admin@test.com
    const testAdmin = await User.findOne({ where: { email: 'admin@test.com' } });
    
    if (testAdmin) {
      console.log(' Usuario admin@test.com encontrado:');
      console.log(` Email: admin@test.com`);
      console.log(` Nombre: ${testAdmin.nombre}`);
      console.log(` Rol: ${testAdmin.role}`);
      console.log(` Estatus: ${testAdmin.estatus}`);
      console.log(' Contraseña: Se reseteó a "admin123" usando resetAdminPassword.js');
    } else {
      console.log(' Usuario admin@test.com NO encontrado');
    }

    // Contar pacientes y otros datos
    const totalUsers = await User.count();
    console.log(`\n Total de usuarios en sistema: ${totalUsers}`);

  } catch (error) {
    console.error(' Error:', error);
  } finally {
    await db.sequelize.close();
  }
};

checkAdminUsers();