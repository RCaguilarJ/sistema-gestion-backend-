#!/bin/bash
set -e

echo "Iniciando despliegue en cPanel..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER_HOME="${USER_HOME:-$HOME}"
PUBLIC_HTML="$USER_HOME/public_html"
APP_DOMAIN="${APP_DOMAIN:-diabetesjalisco.org}"
API_PORT=""

FRONTEND_DIR="${FRONTEND_DIR:-$SCRIPT_DIR/../sistema-gestion-medica}"
BACKEND_DIR="${BACKEND_DIR:-$SCRIPT_DIR}"

ensure_node_runtime() {
  local candidate

  for candidate in \
    "/opt/cpanel/ea-nodejs22/bin" \
    "/opt/cpanel/ea-nodejs20/bin" \
    "/opt/cpanel/ea-nodejs18/bin"
  do
    if [ -x "$candidate/node" ]; then
      export PATH="$candidate:$PATH"
      break
    fi
  done

  if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js no esta disponible en PATH."
    echo "Instala o habilita Node.js en WHM/cPanel antes de desplegar."
    echo "Sugerencia: verifica 'Setup Node.js App' o los paquetes ea-nodejs18/20/22."
    echo "PATH actual: $PATH"
    exit 1
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "Error: npm no esta disponible aunque Node.js existe."
    echo "Revisa la instalacion de EasyApache Node.js."
    exit 1
  fi

  NODE_BIN="$(command -v node)"
  NPM_BIN="$(command -v npm)"

  echo "Node detectado: $NODE_BIN ($(node -v))"
  echo "npm detectado: $NPM_BIN ($(npm -v))"
}

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: No se encontro $FRONTEND_DIR"
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: No se encontro $BACKEND_DIR"
  exit 1
fi

if [ -f "$BACKEND_DIR/.env.production" ]; then
  API_PORT="$(grep -E '^PORT=' "$BACKEND_DIR/.env.production" | tail -n 1 | cut -d'=' -f2 | tr -d '\r')"
fi

API_PORT="${API_PORT:-4000}"

ensure_node_runtime

# 1) Construir frontend
echo "Construyendo frontend..."
cd "$FRONTEND_DIR"
"$NPM_BIN" ci
"$NPM_BIN" run build

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

# 3) Crear .htaccess del frontend con proxy al backend
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
  RewriteRule ^api/(.*) http://localhost:__API_PORT__/api/$1 [P,L]
  RewriteRule ^uploads/(.*) http://localhost:__API_PORT__/uploads/$1 [P,L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/api(/|$)
  RewriteCond %{REQUEST_URI} !^/uploads(/|$)
  RewriteRule ^ index.html [L]
</IfModule>
HTACCESS_EOF

sed -i "s/__API_PORT__/$API_PORT/g" "$PUBLIC_HTML/.htaccess"

echo "Frontend copiado y .htaccess creado"

# 4) Preparar backend en carpeta separada
echo "Preparando backend..."
BACKEND_DEPLOY="$USER_HOME/backend-api"
rm -rf "$BACKEND_DEPLOY"
mkdir -p "$BACKEND_DEPLOY"
cp -r "$BACKEND_DIR"/. "$BACKEND_DEPLOY/"
rm -rf "$BACKEND_DEPLOY/node_modules" "$BACKEND_DEPLOY/.git"

cd "$BACKEND_DEPLOY"
"$NPM_BIN" ci --omit=dev

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
echo "   - App URL/domain: $APP_DOMAIN"
echo "   - Startup file: app.js"
echo "   - Port: $API_PORT"
echo "   - NODE_ENV: production"
echo ""
echo "2. Verificar:"
echo "   - Frontend: https://$APP_DOMAIN"
echo "   - Backend:  https://$APP_DOMAIN/api/health"
echo "=================================================="


