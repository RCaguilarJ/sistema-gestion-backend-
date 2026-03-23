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

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'role'
        AND COLUMN_TYPE LIKE '%RECEPCION%'
    ),
    'SELECT 1',
    "ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN','SUPER_ADMIN','RECEPCION','DOCTOR','NUTRI','PSY','PATIENT','ENDOCRINOLOGO','PODOLOGO','PSICOLOGO') NOT NULL DEFAULT 'DOCTOR'"
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO permissions (nombre, descripcion) VALUES
  ('VIEW_CONFIG', 'Ver configuracion del sistema'),
  ('VIEW_PATIENTS', 'Ver lista de pacientes'),
  ('VIEW_APPOINTMENTS', 'Ver citas'),
  ('VIEW_CONSULTATIONS', 'Ver consultas'),
  ('VIEW_DOCUMENTS', 'Ver documentos'),
  ('VIEW_NUTRITION', 'Ver planes de nutricion'),
  ('VIEW_USERS', 'Ver usuarios del sistema'),
  ('VIEW_DASHBOARD', 'Ver dashboard principal');

INSERT IGNORE INTO roles (nombre, descripcion)
VALUES ('RECEPCION', 'Recepcion con acceso de solo lectura');

DELETE rp
FROM role_permissions rp
INNER JOIN roles r ON r.id = rp.role_id
WHERE r.nombre = 'RECEPCION';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
  ON p.nombre IN (
    'VIEW_CONFIG',
    'VIEW_PATIENTS',
    'VIEW_APPOINTMENTS',
    'VIEW_CONSULTATIONS',
    'VIEW_DOCUMENTS',
    'VIEW_NUTRITION',
    'VIEW_USERS',
    'VIEW_DASHBOARD'
  )
WHERE r.nombre = 'RECEPCION';

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'role_id'
    ),
    "UPDATE users u INNER JOIN roles r ON r.nombre = 'RECEPCION' SET u.role_id = r.id WHERE u.role = 'RECEPCION'",
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
