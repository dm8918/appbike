# BiciOffice

App PWA en español, mobile-first, para que colegas de oficina registren sesiones de bici estática (fecha, km, foto opcional) con gamificación: puntos, niveles, rachas, insignias y ranking.

## Run & Operate

- Workflows: `artifacts/appbike: web` (Vite, port 22521) y `artifacts/appbike: bike-api` (FastAPI/uvicorn, port 22531)
- `pnpm --filter @workspace/appbike run typecheck` — typecheck del frontend
- `pnpm --filter @workspace/appbike run build` — build del frontend a `artifacts/appbike/dist/public` (lo sirve FastAPI en producción)
- API en dev: `localhost:80/bike-api/...` (proxy compartido); en producción: `/api/...`
- Env: `SESSION_SECRET` (cookies firmadas), `DATABASE_URL` (ya seteado globalmente → Postgres dev de Replit; sin él usa SQLite), `UPLOAD_DIR`, `ADMIN_EMAILS`

## Stack

- Frontend: React + Vite + TypeScript + Tailwind, React Query, wouter (artifact `appbike`)
- Backend: Python 3.12 + FastAPI + SQLAlchemy + bcrypt + itsdangerous (cookies de sesión firmadas)
- DB: Postgres en dev (env global `DATABASE_URL`); SQLite como fallback portable
- No usa el api-server Express ni el codegen OpenAPI del monorepo (backend Python a pedido del usuario)

## Where things live

- `artifacts/appbike/src/lib/api.ts` — cliente API del frontend (fuente de verdad del contrato)
- `artifacts/appbike/server/` — backend FastAPI (main.py rutas, models.py, gamification.py, security.py, db.py)
- `artifacts/appbike/public/` — manifest PWA, sw.js, íconos
- `artifacts/appbike/app.yaml` + `README.md` — despliegue en Databricks Apps

## Architecture decisions

- Backend Python (FastAPI) elegido explícitamente por el usuario para portarlo a Databricks Apps (repo github.com/dm8918/appbike)
- Rutas API montadas en `/api` Y `/bike-api` para funcionar igual en dev (proxy Replit) y producción
- En producción FastAPI sirve el frontend compilado (`dist/public`) con fallback SPA — un solo proceso
- Gamificación: puntos = km × 10, 7 niveles en español, 8 insignias, rachas por días consecutivos
- Admin por email: `ADMIN_EMAILS` (default `nico.tagle1@gmail.com`); el flag admin se asigna al registrarse

## Product

- Registro/login con email y contraseña (bcrypt + cookie firmada)
- Registrar sesión: fecha, km, foto de evidencia opcional (acceso a fotos solo dueño/admin)
- Dashboard con puntos, nivel, racha e insignias; historial con borrado; ranking semanal/mensual/total
- Panel admin (`/admin`) para ver resultados de todos los usuarios

## User preferences

- Comunicarse en español
- El usuario despliega él mismo en Databricks Apps; no publicar en Replit sin preguntar

## Gotchas

- `DATABASE_URL` está seteado globalmente en el workspace → el backend usa Postgres dev aunque el default de código sea SQLite; borrar `server/data/` NO borra los datos
- Hay 2 usuarios demo sembrados (laura.demo@oficina.com, pedro.demo@oficina.com, contraseña BiciDemo2026!)
- El workflow de bike-api necesita ruta absoluta en el `cd` (el cwd del workflow no es la raíz del repo)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
