# Jan & Jimels Party Needs — Website & Admin System

Event Rentals & Supplies · Est. 1995 · No. 01 Pelota St., New St. Francis Village, San Juan, Cainta, Rizal

A full website for the business with a 3D landing page, public quotation requests,
and a complete admin panel that replaces pen-and-paper delivery records:

- **3D landing page** (photoreal React Three Fiber hero: banquet table, crystal glassware, balloons)
- **Equipment & Rates section** — equipment poster + live rates from the inventory
- **Quotation/inquiry form** — customers submit name + phone/email + event details; shows the
  **live Pricelist 3 rate sheet** (auto-generated from inventory, printable PDF) + an
  "Other equipment" option for items not listed
- **Orders & Delivery** — record what items, how many, and where they go; status flow:
  Pending → Confirmed → Out for Delivery → Delivered → Completed (with item return tracking);
  **custom equipment** allowed on orders (name/qty/price, no stock effect)
- **Inventory** — Pricelist 3 items; auto-deducts when delivered, adds back on return,
  permanently removes missing pieces, low-stock alerts, per-item photos;
  `seed_pricelist` keeps it in sync with the official pricelist
- **Delivery Map** — pins (orders + manual), customer search with contact details,
  **road directions from the shop** (OSRM, km + minutes), **"All customers" side panel**,
  **trend badges** (per-customer ×N pins) + heatmap, editable shop base
- **Quotations** — web requests + admin-created quotes with **line items**, pricelist
  dropdown, **Custom** items and **N/A** pricing; branded **PDF quotations** and
  **delivery orders** (letterhead + signature)
- **Users** — Super Admin can create/delete Admins
- **Reports** — CSV export of orders & inventory

> 🤖 **For AI agents:** start with `AGENTS.md`, then the `docs/` suite
> (index below). `docs/03` API, `docs/04` database/RLS, `docs/09` security.

## Documentation (docs/)

| File | Covers |
|---|---|
| `docs/00-PROJECT-OVERVIEW.md` | business, features, quickstart, repo map |
| `docs/01-ARCHITECTURE.md` | diagram, request flows, dev/prod serving |
| `docs/02-BACKEND.md` | Django apps, settings, commands, inventory state machine |
| `docs/03-API-REFERENCE.md` | every endpoint + payloads + throttle scopes |
| `docs/04-DATABASE.md` | ER, all models/fields, RLS (enabled), multi-tenant path |
| `docs/05-FRONTEND.md` | pages/components, routing, auth, map module |
| `docs/06-PDF-GENERATION.md` | quotePdf.js layout + data contracts |
| `docs/07-DESIGN-SYSTEM.md` | navy/gold tokens, checklist |
| `docs/08-DEPLOYMENT.md` | Railway steps, env vars, post-deploy checklist |
| `docs/09-SECURITY.md` | JWT/CSRF, rate limits, guards, RLS, test playbook |
| `docs/10-DEVELOPMENT-WORKFLOW.md` | commands (Windows quirk), seeds, git flow |
| `docs/11-SKILLS-EXTENSIONS.md` | .opencode skills usage |

## Tech Stack

| Layer     | Tech                                                              |
| --------- | ----------------------------------------------------------------- |
| Frontend  | React 19 + Vite + Tailwind CSS 4 + Framer Motion + React Three Fiber |
| Backend   | Python Django 5 + Django REST Framework + SimpleJWT               |
| Database  | SQLite (local dev) / PostgreSQL (Railway)                         |
| Maps      | Leaflet + OpenStreetMap (free) + leaflet.heat heatmap             |
| Deploy    | Railway (single service, Nixpacks)                                |

## Local Development

### Backend (Django API)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip.exe install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed
.\.venv\Scripts\python.exe manage.py runserver 8000
```

Default logins (change these in production!):

| Username    | Password      | Role        |
| ----------- | ------------- | ----------- |
| superadmin  | janjimels2026 | Super Admin |
| admin       | janjimels2026 | Admin       |

### Frontend (React)

```powershell
cd frontend
npm install
# NOTE: because the folder name contains an apostrophe ("Jan & Jimel's..."),
# npm scripts may fail on Windows. Run vite directly instead:
node node_modules\vite\bin\vite.js
```

Open http://localhost:5173 — the dev server proxies `/api` to `http://127.0.0.1:8000`.

### Production build (served by Django/Whitenoise)

```powershell
cd frontend
node node_modules\vite\bin\vite.js build   # outputs to backend/frontend_dist
cd ..\backend
.\.venv\Scripts\python.exe manage.py collectstatic --noinput
.\.venv\Scripts\python.exe manage.py runserver 8000   # visit http://localhost:8000
```

### Local Development & LAN Testing

In development the Vite server proxies `/api` to Django, so API calls are same-origin and CORS is never triggered. To test from another device on your network (phone/laptop):

1. Find your PC's LAN IP (e.g. `192.168.1.10`)
2. Start Django and Vite with `--host` (Vite: `node node_modules\vite\bin\vite.js --host`)
3. Set `DJANGO_ALLOWED_HOSTS=192.168.1.10,localhost` and `DJANGO_CORS_ORIGINS=http://192.168.1.10:5173,http://localhost:5173` before starting Django
4. Open `http://192.168.1.10:5173` on the phone

> The API is CSRF-immune by design: it uses JWT bearer tokens + JSON bodies + a strict CORS allowlist (no cookies involved). CSRF protection applies to Django's built-in admin and any session views.

## Deploying on Railway

1. Push this repo to GitHub, then **New Project → Deploy from GitHub repo** on Railway.
2. Add a **PostgreSQL** plugin (Railway sets `DATABASE_URL` automatically).
3. Set environment variables in the service settings:
   - `DJANGO_SECRET_KEY` — a long random string (required in production)
   - `DJANGO_DEBUG` — `false`
   - `DJANGO_ALLOWED_HOSTS` — `your-app.up.railway.app` (or `*`)
   - `DJANGO_CORS_ORIGINS` — comma-separated allowed origins (e.g. `https://your-app.up.railway.app`)
4. `railway.json` handles the build (frontend build + pip install + collectstatic) and
   the start command (migrate + seed + gunicorn). The first deploy seeds default users.

> ⚠ Change the default `superadmin` password after first login (or create new users and
> delete the defaults in **Admin → Users**).

## API Endpoints

| Method | Path                          | Auth | Purpose                          |
| ------ | ----------------------------- | ---- | -------------------------------- |
| POST   | /api/auth/login/              | —    | JWT login                        |
| POST   | /api/auth/login/refresh/      | —    | Refresh token                    |
| GET    | /api/auth/me/                 | ✓    | Current user                     |
| GET    | /api/auth/users/              | ✓    | List users                       |
| POST   | /api/auth/users/register/     | SA   | Create admin (super admin only)  |
| DELETE | /api/auth/users/{id}/delete/  | SA   | Delete admin                     |
| GET    | /api/items/                   | —    | List inventory (public)          |
| POST   | /api/items/                   | ✓    | Add item                         |
| PUT    | /api/items/{id}/              | ✓    | Update item                      |
| DELETE | /api/items/{id}/              | ✓    | Delete item                      |
| GET    | /api/orders/                  | ✓    | List orders (?status, ?search)   |
| POST   | /api/orders/                  | ✓    | Create order                     |
| PUT    | /api/orders/{id}/             | ✓    | Update order (status, returns)   |
| DELETE | /api/orders/{id}/             | ✓    | Delete order                     |
| GET    | /api/orders/pins/             | ✓    | Delivery pins (order pins + manual pins) |
| POST   | /api/orders/pins/             | ✓    | Save a manual pin                 |
| DELETE | /api/orders/pins/{id}/        | ✓    | Delete a manual pin               |
| GET    | /api/orders/customers/?search= | ✓   | Search customers (empty = all) |
| GET/PUT | /api/orders/shop/            | ✓    | Shop base (directions origin)  |
| GET    | /api/orders/routes/?date=     | ✓    | Routes for a date                 |
| POST   | /api/orders/routes/           | ✓    | Save a delivery route (with stops) |
| PUT    | /api/orders/routes/{id}/      | ✓    | Update route / reorder stops      |
| DELETE | /api/orders/routes/{id}/      | ✓    | Delete a route                    |
| GET    | /api/orders/dashboard/        | ✓    | Dashboard stats                  |
| GET    | /api/orders/export/orders.csv | ✓    | CSV export                       |
| GET    | /api/orders/export/inventory.csv | ✓ | CSV export                    |
| POST   | /api/quotations/public/submit/ | —   | Public quotation request         |
| GET    | /api/quotations/public/items/  | —   | Public item list for the form    |
| GET    | /api/quotations/               | ✓   | List quotations (?status, ?source) |
| POST   | /api/quotations/               | ✓   | Create manual quotation          |
| PUT    | /api/quotations/{id}/          | ✓   | Update (items, status, reply)    |

SA = Super Admin only.

Rate limits: anonymous API calls 100/min, admin login 10/min per client, public quotation submission 5/min.

Anonymous visitors only see limited item data (name/category/rate/color/size/photo) — stock levels and notes require an admin login.

PostgreSQL row-level security is **forced** on all business tables (migration `orders/0005_row_level_security`) — see `docs/04-DATABASE.md`.

## How Inventory Sync Works

- Order becomes **Delivered** → items move from "on hand" to "in use".
- Order becomes **Completed** → items return; any missing quantity is permanently
  removed from "on hand".
- Moving an order back from Delivered/Completed releases the items back to stock.
