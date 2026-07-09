#!/usr/bin/env bash
# Genera la carpeta databricks_app/ (raíz del repo) lista para Databricks Apps:
# solo Python + frontend compilado, sin package.json (evita que Databricks
# intente instalar dependencias de Node del monorepo).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="$ROOT/artifacts/appbike"
OUT="$ROOT/databricks_app"

echo "==> Compilando frontend..."
cd "$ROOT"
BASE_PATH=/ PORT=8000 pnpm --filter @workspace/appbike run build

echo "==> Armando $OUT ..."
rm -rf "$OUT"
mkdir -p "$OUT"
cp -r "$APP_DIR/server" "$OUT/server"
rm -rf "$OUT/server/data" "$OUT/server/__pycache__"
mkdir -p "$OUT/dist"
cp -r "$APP_DIR/dist/public" "$OUT/dist/public"
cp "$APP_DIR/requirements.txt" "$OUT/requirements.txt"

cat > "$OUT/app.yaml" <<'YAML'
command:
  - "python"
  - "-m"
  - "uvicorn"
  - "server.main:app"
  - "--host"
  - "0.0.0.0"
  - "--port"
  - "8000"

env:
  - name: "ADMIN_EMAILS"
    value: "nico.tagle1@gmail.com"
  # Recomendado: crea un secreto en Databricks y agrégalo como recurso de la App
  # con la clave "session-secret", luego descomenta estas líneas:
  # - name: "SESSION_SECRET"
  #   valueFrom: "session-secret"
YAML
cp "$OUT/app.yaml" "$OUT/app.yml"

echo "==> Listo. Contenido de databricks_app/:"
ls -la "$OUT"
