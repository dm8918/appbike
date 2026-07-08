---
name: Global DATABASE_URL
description: Workspace sets DATABASE_URL globally; backends with Postgres support pick it up silently
---
This workspace exports DATABASE_URL (Replit dev Postgres, helium) globally to all workflows.
**Why:** BiciOffice's FastAPI backend was designed to default to SQLite, but it silently connected to dev Postgres; deleting server/data/ did not reset data.
**How to apply:** To reset BiciOffice data, TRUNCATE the tables in the dev Postgres, not delete SQLite files. Any new backend with a DATABASE_URL fallback will also use dev Postgres in this workspace.
