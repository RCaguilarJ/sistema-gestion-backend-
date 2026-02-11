#!/bin/bash
set -e

echo "Iniciando despliegue en cPanel..."

USER_HOME="/home/diabetesjalisco"
PUBLIC_HTML="$USER_HOME/public_html"
API_PORT="3000"

FRONTEND_DIR="$(pwd)/sistema-gestion-medica"
BACKEND_DIR="$(pwd)/sistema-gestion-backend-"

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: No se encontro $FRONTEND_DIR"
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: No se encontro $BACKEND_DIR"
  exit 1
fi

# 1) Construir frontend
echo "Construyendo frontend..."
cd "$FRONTEND_DIR"
npm ci
npm run build

if [ ! -d "dist" ]; then
  echo "Error: dist/ no fue generado"
  exit 1
fi

echo "Frontend compilado"

# 2) Copiar a public_html de amdj.desingsgdl.app
echo "Copiando a public_html..."
rm -rf "$PUBLIC_HTML"/*
mkdir -p "$PUBLIC_HTML"
cp -r dist/* "$PUBLIC_HTML/"

# 3) Crear .htaccess (solo SPA routing, sin ProxyPass)
cat > "$PUBLIC_HTML/.htaccess" << 'HTACCESS_EOF'
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
HTACCESS_EOF

echo "Frontend copiado y .htaccess creado"

# 4) Preparar backend en carpeta separada
echo "Preparando backend..."
BACKEND_DEPLOY="$USER_HOME/backend-api"
rm -rf "$BACKEND_DEPLOY"
mkdir -p "$BACKEND_DEPLOY"
cp -r "$BACKEND_DIR"/* "$BACKEND_DEPLOY/"

cd "$BACKEND_DEPLOY"
npm ci --production

echo "Backend preparado"

echo ""
echo "=================================================="
echo "Despliegue completado!"
echo "=================================================="
echo ""
echo "Proximos pasos en cPanel:"
echo ""
echo "1. Node.js App para el backend:"
echo "   - App folder: $BACKEND_DEPLOY"
echo "   - App URL/domain: amdj.desingsgdl.app"
echo "   - Startup file: server.js"
echo "   - Port: $API_PORT"
echo "   - NODE_ENV: production"
echo ""
echo "2. Verificar:"
echo "   - Frontend: https://amdj.desingsgdl.app"
echo "   - Backend:  https://amdj.desingsgdl.app/api/health"
echo "=================================================="
