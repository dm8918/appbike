---
name: BiciOffice deploy target
description: BiciOffice (artifacts/appbike) is self-deployed by the user to Databricks Apps, not Replit
---
The user deploys BiciOffice themselves to Databricks Apps (repo github.com/dm8918/appbike). Do not call suggestDeploy without asking.
**Why:** User explicitly chose a portable Python FastAPI backend for Databricks; Replit publishing is not the target.
**How to apply:** For deploy questions, point to artifacts/appbike/README.md (Databricks steps, app.yaml). Keep the backend portable: SQLite fallback, DATABASE_URL/UPLOAD_DIR env overrides, FastAPI serves dist/public in prod.

**Lesson (Jul 2026):** Databricks Apps detects package.json as a pnpm app and fails with "No command to run" if app.yaml/app.yml with `command` is not at the app root. Repo must include both app.yaml and app.yml (identical) and the committed `dist/public` build — FastAPI serves it in prod.
