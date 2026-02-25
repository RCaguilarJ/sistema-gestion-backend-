CREATE TABLE IF NOT EXISTS `psicologia_sesiones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pacienteId` INT NOT NULL,
  `psicologoId` INT NULL,
  `fecha` DATE NOT NULL,
  `estadoAnimo` VARCHAR(100) NULL,
  `adherencia` INT NULL,
  `estres` INT NULL,
  `intervenciones` TEXT NULL,
  `notas` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_psico_sesion_paciente` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_psico_sesion_psicologo` FOREIGN KEY (`psicologoId`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `psicologia_evaluaciones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pacienteId` INT NOT NULL,
  `psicologoId` INT NULL,
  `titulo` VARCHAR(150) NOT NULL,
  `fecha` DATE NOT NULL,
  `ansiedadScore` VARCHAR(20) NULL,
  `ansiedadNivel` VARCHAR(50) NULL,
  `depresionScore` VARCHAR(20) NULL,
  `depresionNivel` VARCHAR(50) NULL,
  `autoeficaciaScore` VARCHAR(20) NULL,
  `autoeficaciaNivel` VARCHAR(50) NULL,
  `estrategias` TEXT NULL,
  `notas` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_psico_eval_paciente` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_psico_eval_psicologo` FOREIGN KEY (`psicologoId`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `psicologia_objetivos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pacienteId` INT NOT NULL,
  `psicologoId` INT NULL,
  `objetivo` TEXT NOT NULL,
  `progreso` INT NULL,
  `tono` VARCHAR(20) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_psico_obj_paciente` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_psico_obj_psicologo` FOREIGN KEY (`psicologoId`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `psicologia_estrategias` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pacienteId` INT NOT NULL,
  `psicologoId` INT NULL,
  `estrategia` VARCHAR(200) NOT NULL,
  `frecuencia` VARCHAR(100) NULL,
  `estado` VARCHAR(50) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_psico_est_paciente` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_psico_est_psicologo` FOREIGN KEY (`psicologoId`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `psicologia_notas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pacienteId` INT NOT NULL,
  `psicologoId` INT NULL,
  `nota` TEXT NOT NULL,
  `fecha` DATE NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_psico_nota_paciente` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_psico_nota_psicologo` FOREIGN KEY (`psicologoId`) REFERENCES `users` (`id`) ON DELETE SET NULL
);
