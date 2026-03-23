CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO roles (id, nombre, descripcion) VALUES
  (1, 'SUPER_ADMIN', 'Super Administrador con acceso completo'),
  (2, 'ADMIN', 'Administrador con permisos de gestion'),
  (3, 'NUTRIOLOGO', 'Nutriologo con acceso a pacientes'),
  (4, 'USUARIO', 'Usuario basico del sistema');

INSERT IGNORE INTO permissions (id, nombre, descripcion) VALUES
  (1, 'VIEW_CONFIG', 'Ver configuracion del sistema'),
  (2, 'EDIT_CONFIG', 'Editar configuracion del sistema'),
  (3, 'VIEW_PATIENTS', 'Ver lista de pacientes'),
  (4, 'CREATE_PATIENT', 'Crear nuevos pacientes'),
  (5, 'EDIT_PATIENT', 'Editar informacion de pacientes'),
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
  (16, 'VIEW_NUTRITION', 'Ver planes de nutricion'),
  (17, 'CREATE_NUTRITION', 'Crear planes de nutricion'),
  (18, 'EDIT_NUTRITION', 'Editar planes de nutricion'),
  (19, 'VIEW_USERS', 'Ver usuarios del sistema'),
  (20, 'CREATE_USERS', 'Crear nuevos usuarios'),
  (21, 'EDIT_USERS', 'Editar usuarios'),
  (22, 'DELETE_USERS', 'Eliminar usuarios'),
  (23, 'VIEW_DASHBOARD', 'Ver dashboard principal');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, p.id FROM permissions p;

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (2, 1), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10),
  (2, 11), (2, 12), (2, 13), (2, 14), (2, 15), (2, 16), (2, 17), (2, 18),
  (2, 19), (2, 20), (2, 21), (2, 22), (2, 23);

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (3, 3), (3, 4), (3, 5), (3, 7), (3, 8), (3, 9), (3, 11), (3, 12), (3, 13),
  (3, 14), (3, 15), (3, 16), (3, 17), (3, 18), (3, 23);

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (4, 14), (4, 23);
