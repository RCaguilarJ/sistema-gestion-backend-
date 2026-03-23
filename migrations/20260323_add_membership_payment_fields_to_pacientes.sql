SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pacientes'
        AND COLUMN_NAME = 'grupoAdultos'
    ),
    'SELECT 1',
    'ALTER TABLE pacientes ADD COLUMN grupoAdultos VARCHAR(255) NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pacientes'
        AND COLUMN_NAME = 'talla'
    ),
    'SELECT 1',
    'ALTER TABLE pacientes ADD COLUMN talla VARCHAR(50) NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pacientes'
        AND COLUMN_NAME = 'programa'
    ),
    'SELECT 1',
    'ALTER TABLE pacientes ADD COLUMN programa VARCHAR(255) NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pacientes'
        AND COLUMN_NAME = 'campana'
    ),
    'SELECT 1',
    'ALTER TABLE pacientes ADD COLUMN campana VARCHAR(255) NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pacientes'
        AND COLUMN_NAME = 'tipoMembresia'
    ),
    'SELECT 1',
    'ALTER TABLE pacientes ADD COLUMN tipoMembresia VARCHAR(100) NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pacientes'
        AND COLUMN_NAME = 'estadoPago'
    ),
    'SELECT 1',
    'ALTER TABLE pacientes ADD COLUMN estadoPago VARCHAR(100) NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
