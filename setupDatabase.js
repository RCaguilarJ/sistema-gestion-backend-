import bcrypt from 'bcryptjs';
import db from './src/models/index.js';

const setupDatabase = async () => {
  try {
    console.log('Iniciando configuración de la base de datos...');

    // Crear las tablas necesarias para el sistema de roles y permisos
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ Tabla roles creada');

    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ Tabla permissions creada');

    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE KEY unique_role_permission (role_id, permission_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ Tabla role_permissions creada');

    // Verificar si la tabla users tiene la columna role_id
    const [userTableInfo] = await db.sequelize.query(`
      DESCRIBE users;
    `);
    
    const hasRoleId = userTableInfo.some(column => column.Field === 'role_id');
    
    if (!hasRoleId) {
      await db.sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN role_id INT DEFAULT 3,
        ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
      `);
      console.log('✓ Columna role_id agregada a tabla users');
    }

    // Insertar roles básicos
    await db.sequelize.query(`
      INSERT IGNORE INTO roles (id, nombre, descripcion) VALUES
      (1, 'SUPER_ADMIN', 'Super Administrador con acceso completo'),
      (2, 'ADMIN', 'Administrador con permisos de gestión'),
      (3, 'NUTRIOLOGO', 'Nutriólogo con acceso a pacientes'),
      (4, 'USUARIO', 'Usuario básico del sistema');
    `);
    console.log('✓ Roles básicos insertados');

    // Insertar permisos básicos
    await db.sequelize.query(`
      INSERT IGNORE INTO permissions (id, nombre, descripcion) VALUES
      (1, 'VIEW_CONFIG', 'Ver configuración del sistema'),
      (2, 'EDIT_CONFIG', 'Editar configuración del sistema'),
      (3, 'VIEW_PATIENTS', 'Ver lista de pacientes'),
      (4, 'CREATE_PATIENT', 'Crear nuevos pacientes'),
      (5, 'EDIT_PATIENT', 'Editar información de pacientes'),
      (6, 'DELETE_PATIENT', 'Eliminar pacientes'),
      (7, 'VIEW_APPOINTMENTS', 'Ver citas'),
      (8, 'CREATE_APPOINTMENT', 'Crear nuevas citas'),
      (9, 'EDIT_APPOINTMENT', 'Editar citas'),
      (10, 'DELETE_APPOINTMENT', 'Cancelar citas'),
      (11, 'VIEW_CONSULTATIONS', 'Ver consultas'),
      (12, 'CREATE_CONSULTATION', 'Crear nuevas consultas'),
      (13, 'EDIT_CONSULTATION', 'Editar consultas'),
      (14, 'VIEW_DOCUMENTS', 'Ver documentos'),
      (15, 'UPLOAD_DOCUMENTS', 'Subir documentos'),
      (16, 'VIEW_NUTRITION', 'Ver planes de nutrición'),
      (17, 'CREATE_NUTRITION', 'Crear planes de nutrición'),
      (18, 'EDIT_NUTRITION', 'Editar planes de nutrición'),
      (19, 'VIEW_USERS', 'Ver usuarios del sistema'),
      (20, 'CREATE_USERS', 'Crear nuevos usuarios'),
      (21, 'EDIT_USERS', 'Editar usuarios'),
      (22, 'DELETE_USERS', 'Eliminar usuarios'),
      (23, 'VIEW_DASHBOARD', 'Ver dashboard principal');
    `);
    console.log('✓ Permisos básicos insertados');

    // Asignar permisos a roles
    // SUPER_ADMIN - Todos los permisos
    await db.sequelize.query(`
      INSERT IGNORE INTO role_permissions (role_id, permission_id)
      SELECT 1, p.id FROM permissions p;
    `);

    // ADMIN - Casi todos los permisos excepto super admin
    await db.sequelize.query(`
      INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
      (2, 1), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10),
      (2, 11), (2, 12), (2, 13), (2, 14), (2, 15), (2, 16), (2, 17), (2, 18),
      (2, 19), (2, 20), (2, 21), (2, 22), (2, 23);
    `);

    // NUTRIOLOGO - Permisos relacionados con pacientes, citas, consultas y nutrición
    await db.sequelize.query(`
      INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
      (3, 3), (3, 4), (3, 5), (3, 7), (3, 8), (3, 9), (3, 11), (3, 12), (3, 13),
      (3, 14), (3, 15), (3, 16), (3, 17), (3, 18), (3, 23);
    `);

    // USUARIO - Permisos básicos
    await db.sequelize.query(`
      INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
      (4, 23), (4, 14);
    `);

    console.log('✓ Permisos asignados a roles');

    // Actualizar usuarios existentes para asignarles un role_id si no lo tienen
    await db.sequelize.query(`
      UPDATE users SET role_id = 4 WHERE role_id IS NULL;
    `);

    // Crear usuario super admin si no existe
    const adminEmail = 'admin@sistema.com';
    const [existingAdmin] = await db.sequelize.query(`
      SELECT id FROM users WHERE email = ?;
    `, { replacements: [adminEmail] });

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.sequelize.query(`
        INSERT INTO users (nombre, email, password, role_id) 
        VALUES ('Super Administrador', ?, ?, 1);
      `, { replacements: [adminEmail, hashedPassword] });
      
      console.log(`✓ Usuario super admin creado: ${adminEmail} / admin123`);
    }

    // Crear usuario admin si no existe
    const adminEmail2 = 'admin@example.com';
    const [existingAdmin2] = await db.sequelize.query(`
      SELECT id FROM users WHERE email = ?;
    `, { replacements: [adminEmail2] });

    if (existingAdmin2.length === 0) {
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await db.sequelize.query(`
        INSERT INTO users (nombre, email, password, role_id) 
        VALUES ('Administrador', ?, ?, 2);
      `, { replacements: [adminEmail2, hashedPassword] });
      
      console.log(`✓ Usuario admin creado: ${adminEmail2} / password`);
    } else {
      // Actualizar el usuario existente para tener role_id
      await db.sequelize.query(`
        UPDATE users SET role_id = 2 WHERE email = ?;
      `, { replacements: [adminEmail2] });
      console.log(`✓ Usuario admin actualizado con role_id`);
    }

    console.log('\n🎉 Base de datos configurada exitosamente!');
    console.log('\nUsuarios de prueba:');
    console.log('- Super Admin: admin@sistema.com / admin123');
    console.log('- Admin: admin@example.com / password');

  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
  } finally {
    await db.sequelize.close();
  }
};

// Ejecutar solo si este archivo es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export default setupDatabase;