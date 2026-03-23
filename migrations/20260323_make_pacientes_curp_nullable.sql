SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pacientes'
        AND COLUMN_NAME = 'curp'
        AND IS_NULLABLE = 'NO'
    ),
    'ALTER TABLE pacientes MODIFY COLUMN curp VARCHAR(255) NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
