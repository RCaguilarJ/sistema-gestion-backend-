import bcrypt from 'bcryptjs';
import db from './src/models/index.js';

const createUsers = async () => {
  try {
    console.log('🚀 Creando usuarios de prueba...');
    
    const User = db.User;
    
    const usuarios = [
      {
        nombre: 'Dr. Carlos García',
        username: 'dr.garcia',
        email: 'carlos@clinica.com',
        password: 'password123',
        role: 'Doctor',
        estatus: 'Activo'
      },
      {
        nombre: 'Lic. María López',
        username: 'maria.lopez',
        email: 'maria@clinica.com',
        password: 'password123',
        role: 'Nutriólogo',
        estatus: 'Activo'
      },
      {
        nombre: 'Juan Pérez',
        username: 'juan.perez',
        email: 'juan@paciente.com',
        password: 'password123',
        role: 'Paciente',
        estatus: 'Activo'
      }
    ];

    for (const userData of usuarios) {
      // Verificar si ya existe
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (!existingUser) {
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Crear usuario
        await User.create({
          ...userData,
          password: hashedPassword
        });
        
        console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);
      } else {
        console.log(`⚠️  Usuario ya existe: ${userData.email}`);
      }
    }

    console.log('\n🎉 ¡Proceso completado!');
    console.log('\nUsuarios de prueba:');
    usuarios.forEach(u => {
      console.log(`- ${u.email} / password123 (${u.role})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.sequelize.close();
  }
};

createUsers();