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

2. **Subir el código** al repo `github.com/dm8918/appbike`. El contenido de esta carpeta (`artifacts/appbike/`) debe quedar en la **raíz del repo**, incluyendo:
   - `app.yaml` y `app.yml` (idénticos; Databricks debe encontrar uno de los dos en la raíz)
   - `dist/public/` (frontend compilado)
   - `server/` y `requirements.txt`

3. **Crear la App en Databricks**: Workspace → Compute → Apps → *Create App* → conectar al repo de GitHub. Databricks ejecuta el `command` de `app.yaml` (uvicorn en el puerto 8000).

4. **Configurar secretos/entorno** en la App:
   - `SESSION_SECRET` (recomendado): crea un secreto en Databricks, agrégalo como recurso de la App con clave `session-secret` y descomenta las líneas correspondientes en `app.yaml`.
   - `DATABASE_URL` (recomendado): conexión a Lakebase/Postgres para que los datos persistan. Sin esto se usa SQLite, que puede perderse al reiniciar la app.
   - `UPLOAD_DIR`: idealmente una ruta a un Volume de Unity Catalog (ej. `/Volumes/main/default/bicioffice_fotos`) para que las fotos persistan.
   - `ADMIN_EMAILS`: ya viene en `app.yaml`; edítalo si quieres más administradores.

5. **Listo**: la app queda disponible en la URL que asigna Databricks. El primer usuario que se registre con `nico.tagle1@gmail.com` será administrador automáticamente.

### Solución de problemas

- **"No command to run. pnpm apps must specify the start command in app.yaml"**: Databricks detectó el `package.json` (app Node) pero no encontró `app.yaml`/`app.yml` con `command` en la carpeta raíz de la App. Verifica que `app.yaml` esté en la raíz del repo (no dentro de una subcarpeta) y que esté commiteado.
- **La página carga pero se ve en blanco / 404**: falta `dist/public` en el repo. Ejecuta `pnpm run build` y commitea la carpeta `dist/`.
- **Los datos se pierden al reiniciar**: configura `DATABASE_URL` (Lakebase) y `UPLOAD_DIR` (Volume).

## API

Todas las rutas están montadas bajo `/api` (y `/bike-api` en desarrollo Replit):

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET/POST /api/rides`, `DELETE /api/rides/{id}` (multipart con foto opcional)
- `GET /api/photos/{filename}` (solo dueño o admin)
- `GET /api/stats/me` (puntos, nivel, racha, insignias)
- `GET /api/leaderboard?period=week|month|all`
- `GET /api/admin/users`, `GET /api/admin/rides` (solo admin)
