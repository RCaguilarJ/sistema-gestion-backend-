# Sistema de Gestión Médica - Backend

Backend para el Sistema de Gestión Médica desarrollado con Node.js, Express y Sequelize.

## 🚀 Características

- API RESTful para autenticación de usuarios
- Gestión de pacientes
- Conexión a base de datos MySQL con Sequelize ORM
- Manejo robusto de errores de conexión a base de datos
- Soporte para variables de entorno
- CORS configurado para frontend

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MySQL Server (opcional - el servidor arrancará sin él)
- npm o yarn

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd sistema-gestion-backend-
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

4. Edita el archivo `.env` con tus credenciales de base de datos:
```env
PORT=4000
DB_NAME=sistema_gestion_medica
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_DIALECT=mysql
JWT_SECRET=tu-secreto-muy-seguro
FRONTEND_URL=http://localhost:5173
```

5. (Opcional) Crea la base de datos en MySQL:
```sql
CREATE DATABASE sistema_gestion_medica;
```

## 🏃 Ejecución

### Modo desarrollo (con nodemon):
```bash
npm run dev
```

### Modo producción:
```bash
node index.js
```

El servidor se iniciará en `http://localhost:4000` (o el puerto especificado en `.env`).

## 🛡️ Manejo de Errores

El servidor está diseñado para iniciar **incluso si la base de datos no está disponible**. En este caso:

- El servidor mostrará una advertencia en la consola
- Las rutas de autenticación devolverán un error 503 con el mensaje:
  ```json
  {
    "message": "Servicio de base de datos no disponible. Por favor, intente más tarde.",
    "error": "Database connection failed"
  }
  ```

Esto permite que el frontend se conecte al backend sin errores de `ERR_CONNECTION_REFUSED`.

## 📚 API Endpoints

### Autenticación

#### Registro de Usuario
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "usuario",
  "email": "usuario@ejemplo.com",
  "password": "contraseña",
  "role": "Doctor" | "Administrador" | "Nutriólogo"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

### Pacientes
```
GET /api/pacientes
POST /api/pacientes
GET /api/pacientes/:id
PUT /api/pacientes/:id
DELETE /api/pacientes/:id
```

## 🔒 Seguridad

- Las contraseñas se hashean con bcrypt antes de almacenarse
- JWT para autenticación de usuarios
- CORS configurado para prevenir accesos no autorizados

## 🐛 Solución de Problemas

### Error: ERR_CONNECTION_REFUSED

Si ves este error en el frontend, verifica que:
1. El servidor backend esté ejecutándose
2. El puerto sea el correcto (4000 por defecto)
3. Las configuraciones de CORS permitan el origen del frontend

### Error: Database connection failed

Este mensaje indica que MySQL no está disponible. Puedes:
1. Iniciar el servidor MySQL/WAMP
2. Verificar las credenciales en el archivo `.env`
3. Crear la base de datos si no existe

El servidor seguirá funcionando para otras operaciones que no requieran la base de datos.

## 📝 Licencia

ISC
