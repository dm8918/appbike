# BiciOffice 🚴

App web (PWA) para registrar sesiones de bici estática en la oficina, con puntos, niveles, rachas, insignias y ranking entre colegas. Frontend en React + Vite, backend en Python (FastAPI).

## Estructura

```
artifacts/appbike/
├── src/            # Frontend React (Vite, TypeScript, Tailwind)
├── public/         # Manifest PWA, service worker, íconos
├── server/         # Backend FastAPI
│   ├── main.py     # Rutas (auth, rides, photos, stats, leaderboard, admin)
│   ├── db.py       # SQLAlchemy (SQLite por defecto, o DATABASE_URL)
│   ├── models.py   # Modelos User y Ride
│   ├── security.py # bcrypt + cookies firmadas
│   └── gamification.py
├── requirements.txt
└── app.yaml        # Config para Databricks Apps
```

## Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `SESSION_SECRET` | Clave para firmar cookies de sesión (obligatoria en producción) | dev-secret inseguro |
| `DATABASE_URL` | Conexión a base de datos (Postgres/Lakebase) | SQLite en `server/data/bike.db` |
| `DATA_DIR` | Carpeta para datos SQLite | `server/data` |
| `UPLOAD_DIR` | Carpeta para fotos de evidencia | `server/data/uploads` |
| `ADMIN_EMAILS` | Emails admin separados por coma | `nico.tagle1@gmail.com` |

## Ejecutar localmente

```bash
# Backend
pip install -r requirements.txt
python -m uvicorn server.main:app --host 0.0.0.0 --port 8000

# Frontend (desarrollo)
pnpm install
pnpm run dev
```

En producción, el backend FastAPI sirve el frontend compilado desde `dist/public` (SPA fallback incluido), por lo que basta un solo proceso.

## Despliegue en Databricks Apps

1. **Compilar el frontend** (una vez, antes de subir):
   ```bash
   pnpm install && pnpm run build
   ```
   Esto genera `dist/public/`, que FastAPI sirve automáticamente. **`dist/` debe ir incluido en el repo** (el `.gitignore` ya lo permite).

2. **Generar la carpeta de despliegue limpia** (`databricks_app/` en la raíz del repo):
   ```bash
   bash artifacts/appbike/build_databricks.sh
   ```
   Esta carpeta contiene **solo Python + el frontend compilado** (`app.yaml`, `requirements.txt`, `server/`, `dist/public/`), sin `package.json`. Esto es clave: Databricks Apps instala dependencias de Node si ve un `package.json`, y el `package.json` del monorepo hace fallar la instalación con "Error installing packages".

3. **Subir el repo a GitHub** y **crear la App en Databricks** apuntando la ruta del código fuente (*source code path*) a la carpeta `databricks_app/` — NO a la raíz del repo. Databricks detecta la app como Python, instala `requirements.txt` con pip y ejecuta el `command` de `app.yaml` (uvicorn en el puerto 8000).

4. **Configurar secretos/entorno** en la App:
   - `SESSION_SECRET` (recomendado): crea un secreto en Databricks, agrégalo como recurso de la App con clave `session-secret` y descomenta las líneas correspondientes en `app.yaml`.
   - `DATABASE_URL` (recomendado): conexión a Lakebase/Postgres para que los datos persistan. Sin esto se usa SQLite, que puede perderse al reiniciar la app.
   - `UPLOAD_DIR`: idealmente una ruta a un Volume de Unity Catalog (ej. `/Volumes/main/default/bicioffice_fotos`) para que las fotos persistan.
   - `ADMIN_EMAILS`: ya viene en `app.yaml`; edítalo si quieres más administradores.

5. **Listo**: la app queda disponible en la URL que asigna Databricks. El primer usuario que se registre con `nico.tagle1@gmail.com` será administrador automáticamente.

### Solución de problemas

- **"No command to run. pnpm apps must specify the start command in app.yaml"**: la ruta de código fuente de la App no contiene `app.yaml`/`app.yml` con `command`. Apunta la App a la carpeta `databricks_app/`.
- **"Error installing packages"**: la App está apuntando a una carpeta con `package.json` (Databricks intenta instalar dependencias de Node del monorepo). Apunta la App a `databricks_app/`, que no tiene `package.json`.
- **La página carga pero se ve en blanco / 404**: falta `dist/public` en la carpeta desplegada. Vuelve a ejecutar `bash artifacts/appbike/build_databricks.sh` y commitea `databricks_app/`.
- **Los datos se pierden al reiniciar**: configura `DATABASE_URL` (Lakebase) y `UPLOAD_DIR` (Volume).
- Tras cambiar el frontend o el servidor, **regenera** `databricks_app/` con el script y vuelve a subir el repo.

## API

Todas las rutas están montadas bajo `/api` (y `/bike-api` en desarrollo Replit):

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET/POST /api/rides`, `DELETE /api/rides/{id}` (multipart con foto opcional)
- `GET /api/photos/{filename}` (solo dueño o admin)
- `GET /api/stats/me` (puntos, nivel, racha, insignias)
- `GET /api/leaderboard?period=week|month|all`
- `GET /api/admin/users`, `GET /api/admin/rides` (solo admin)
