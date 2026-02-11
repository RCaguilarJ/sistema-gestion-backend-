# Guia de Despliegue en cPanel

## Arquitectura (dominios separados)

```
amdj.desingsgdl.app        amdj.desingsgdl.app
        |                                |
   Apache (SPA)                    Node.js App
   public_html/                    backend-api/
        |                                |
   React (Vite)                    Express API
                                         |
                                   MySQL (diabetesjalisco_app)
```

- **Frontend** llama a `https://amdj.desingsgdl.app/api/...`
- **Backend** permite CORS desde `https://amdj.desingsgdl.app`
- Ya NO se necesita ProxyPass en .htaccess

## Requisitos

- Acceso SSH/cPanel
- Node.js 18+ en cPanel
- Subdominios amdj.desingsgdl.app y amdj.desingsgdl.app creados en cPanel
- Base de datos MySQL en produccion

## Paso a Paso

### 1. Crear subdominios en cPanel

1. cPanel -> Domains -> Subdomains (o Domains)
2. Crear `amdj.desingsgdl.app` -> apunta a `public_html/` (o su carpeta propia)
3. Crear `amdj.desingsgdl.app` -> se manejara con Node.js App

### 2. Subir Frontend

1. Compilar: `npm run build` en `sistema-gestion-medica/`
2. Subir contenido de `dist/` a la carpeta de `amdj.desingsgdl.app`
3. Crear `.htaccess` con SPA routing (ver .htaccess.template)

### 3. Subir Backend

1. Subir carpeta del backend (sin node_modules) a `/home/diabetesjalisco/backend-api/`
2. Asegurarse que `.env.production` esta incluido

### 4. Crear Node.js App en cPanel

```
cPanel -> Software -> Node.js App -> Create
  App folder: /home/diabetesjalisco/backend-api
  App URL/domain: amdj.desingsgdl.app
  Startup file: server.js
  Node version: 18+
```

**Importante:** Agregar variable de entorno `NODE_ENV` = `production`

Despues de crear, ejecutar `npm install` desde la interfaz de cPanel.

### 5. Verificar

```javascript
// Health check del backend:
fetch('https://amdj.desingsgdl.app/api/health')
  .then(r => r.json()).then(console.log)
// Esperado: { ok: true, timestamp: "..." }

// Frontend: abrir https://amdj.desingsgdl.app
```

## Troubleshooting

### Frontend carga pero no conecta al backend

**Causa:** CORS o VITE_API_URL mal configurado

**Solucion:**
1. Abrir consola (F12) y ver el error exacto
2. Si es CORS: verificar que `.env.production` del backend tiene `FRONTEND_URLS=https://amdj.desingsgdl.app`
3. Si es 404: verificar que `VITE_API_URL=https://amdj.desingsgdl.app` en el frontend y recompilar

### Node.js se queda "Stopped"

1. cPanel -> Node.js App -> ver Logs
2. Verificar que `.env.production` tiene credenciales validas
3. Click en "Restart"

### CORS Error en consola

1. Editar `.env.production` del backend
2. Verificar: `FRONTEND_URLS=https://amdj.desingsgdl.app`
3. Reiniciar Node.js en cPanel

### "Mixed Content" error

El frontend esta en HTTPS pero llama al backend en HTTP.
Verificar que `VITE_API_URL=https://amdj.desingsgdl.app` (con https).

## Checklist

- [x] .env.production del backend configurado
- [x] .env.production del frontend configurado
- [ ] Subdominios creados en cPanel
- [ ] Frontend subido a public_html
- [ ] .htaccess creado con SPA routing
- [ ] Backend subido a backend-api/
- [ ] Node.js App creada con NODE_ENV=production
- [ ] npm install ejecutado en cPanel
- [ ] /api/health responde
- [ ] Login funciona desde amdj.desingsgdl.app

