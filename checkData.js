import db from './src/models/index.js';

const checkDatabaseData = async () => {
  try {
    const { Paciente, Cita, Consulta, User } = db;
    
    console.log('📊 ESTADO ACTUAL DE LA BASE DE DATOS');
    console.log('=====================================\n');

    // Contar usuarios
    const totalUsers = await User.count();
    const adminUsers = await User.count({ where: { role: { [db.Sequelize.Op.like]: '%admin%' } } });
    const doctorUsers = await User.count({ where: { role: 'Doctor' } });
    const nutriUsers = await User.count({ where: { role: { [db.Sequelize.Op.like]: '%nutri%' } } });
    
    console.log('👥 USUARIOS:');
    console.log(`   Total: ${totalUsers}`);
    console.log(`   Administradores: ${adminUsers}`);
    console.log(`   Doctores: ${doctorUsers}`);
    console.log(`   Nutriólogos: ${nutriUsers}\n`);

    // Contar pacientes
    const totalPacientes = await Paciente.count();
    const pacientesActivos = await Paciente.count({ where: { estatus: 'Activo' } });
    
    console.log('🏥 PACIENTES:');
    console.log(`   Total: ${totalPacientes}`);
    console.log(`   Activos: ${pacientesActivos}\n`);

    // Contar citas
    const totalCitas = await Cita.count();
    const citasPendientes = await Cita.count({ where: { estado: 'Pendiente' } });
    
    console.log('📅 CITAS:');
    console.log(`   Total: ${totalCitas}`);
    console.log(`   Pendientes: ${citasPendientes}\n`);

    // Contar consultas
    const totalConsultas = await Consulta.count();
    
    console.log('📋 CONSULTAS:');
    console.log(`   Total: ${totalConsultas}\n`);

    if (totalPacientes === 0 && totalCitas === 0 && totalConsultas === 0) {
      console.log('⚠️  ADVERTENCIA: No hay datos de pacientes, citas ni consultas');
      console.log('💡 Esto puede deberse a:');
      console.log('   - Base de datos nueva/limpia');
      console.log('   - Se ejecutó algún script de reset');
      console.log('   - Problema de conexión a la BD\n');
      
      console.log('🔧 SOLUCIÓN:');
      console.log('   Puedes crear datos de prueba con el administrador desde el frontend');
      console.log('   o usar los scripts de seeding disponibles.');
    }

  } catch (error) {
    console.error('❌ Error al verificar datos:', error);
  } finally {
    await db.sequelize.close();
  }
};

checkDatabaseData();