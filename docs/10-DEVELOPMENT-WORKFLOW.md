# 10 — Development Workflow

## One-click start (recommended)

Double-click **`start-local.bat`** (or run `powershell -ExecutionPolicy Bypass -File start-local.ps1`).
It starts Django (:8000) and Vite (:5173) in minimized windows, waits for boot, and
prints the website/admin links. Close the two minimized windows to stop the servers.

## Environment quirks (Windows)

- The project folder is `Jan & Jimel's project web app` — the **apostrophe breaks
  `npm run` scripts**. Always run vite via node directly:
  `node node_modules\vite\bin\vite.js [build]`
- Use `npm.cmd` instead of `npm` for installs.

## Daily commands

```powershell
# backend (port 8000)
cd backend
.\.venv\Scripts\python.exe manage.py runserver 8000
.\.venv\Scripts\python.exe manage.py check          # Django system check
.\.venv\Scripts\python.exe manage.py makemigrations / migrate
.\.venv\Scripts\python.exe manage.py seed           # users + shop + Pricelist 3
.\.venv\Scripts\python.exe manage.py seed_pricelist --clean-legacy

# frontend (port 5173, proxies /api → 8000)
cd frontend
node node_modules\vite\bin\vite.js                  # dev server
node node_modules\vite\bin\vite.js build             # → backend/frontend_dist
node node_modules\oxlint\bin\oxlint src              # lint

# production-style local serve (after build + collectstatic)
cd backend
.\.venv\Scripts\python.exe manage.py collectstatic --noinput
.\.venv\Scripts\python.exe manage.py runserver 8000   # visit :8000 (SPA + API)
```

## Working with the code

- Kill leftover servers cleanly: find python/node processes for `runserver`/`vite`
  and stop them before restarting (stale processes have caused "works in shell
  but not HTTP" confusion before).
- Frontend edits are hot-reloaded by vite; backend edits need a Django restart
  (or use `--reload`-style autoreload).
- API responses are paginated (`results`); frontend uses `data.results || data`.

## Data / seeds

- `seed_pricelist` upserts by item name from the official Pricelist 3 image
  (`images/pricelist 3.jpg`). When the business changes prices → update the
  command's list, run it, commit.
- Test data cleanup: `manage.py shell -c "from orders.models import Order; Order.objects.all().delete()"` etc.

## Testing conventions (manual API matrix)

Login (valid/invalid/overlong/throttled), anonymous 401s, public items payload
limits, CORS allow/deny, inventory state machine (delivered → completed math),
quotation round-trip with N/A lines, pins/routes CRUD, CSV exports.

## Git flow

- Branch: `main` only; push to origin when the user asks.
- Commit style: short imperative summaries (see history).
- `.gitignore` covers `.venv`, `node_modules`, `db.sqlite3`, `staticfiles`,
  `frontend_dist`, logs/pids.

## Before finishing any task

1. `python manage.py check` (backend) and `oxlint src` (frontend)
2. `vite build` if frontend changed
3. Quick smoke: pages `/`, `/quote`, `/admin/login`; one authenticated API call
