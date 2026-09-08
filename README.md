# Jan & Jimels Party Needs — Website & Admin System

Event Rentals & Supplies · Est. 1995 · #1 Pelota St., Saint Francis Village, Cainta, Rizal

A full website for the business with a 3D landing page, public quotation requests,
and a complete admin panel that replaces pen-and-paper delivery records:

- **3D landing page** (React Three Fiber hero: balloons, confetti, party table)
- **Quotation/inquiry form** — customers submit name + phone/email + event details
- **Orders & Delivery** — record what items, how many, and where they go; status flow:
  Pending → Confirmed → Out for Delivery → Delivered → Completed (with item return tracking)
- **Inventory** — chairs, tables, linens/cloths ("used clothes"), covers & sashes, tents,
  sound & lights, décor, glassware; auto-deducts when delivered, adds back on return,
  permanently removes missing pieces, low-stock alerts
- **Delivery Map** — every order location pinned (Leaflet + OpenStreetMap, free, no API key),
  filter by month/status, heatmap of areas served
- **Users** — Super Admin can create/delete Admins
- **Reports** — CSV export of orders & inventory, printable PDF quotations

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

## Deploying on Railway

1. Push this repo to GitHub, then **New Project → Deploy from GitHub repo** on Railway.
2. Add a **PostgreSQL** plugin (Railway sets `DATABASE_URL` automatically).
3. Set environment variables in the service settings:
   - `DJANGO_SECRET_KEY` — a long random string
   - `DJANGO_DEBUG` — `false`
   - `DJANGO_ALLOWED_HOSTS` — `your-app.up.railway.app` (or `*`)
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
| GET    | /api/orders/pins/             | ✓    | Delivery pins for the map        |
| GET    | /api/orders/dashboard/        | ✓    | Dashboard stats                  |
| GET    | /api/orders/export/orders.csv | ✓    | CSV export                       |
| GET    | /api/orders/export/inventory.csv | ✓ | CSV export                    |
| POST   | /api/quotations/public/submit/ | —   | Public quotation request         |
| GET    | /api/quotations/public/items/  | —   | Public item list for the form    |
| GET    | /api/quotations/               | ✓   | List quotation requests          |
| PUT    | /api/quotations/{id}/          | ✓   | Reply / change status            |

SA = Super Admin only.

## How Inventory Sync Works

- Order becomes **Delivered** → items move from "on hand" to "in use".
- Order becomes **Completed** → items return; any missing quantity is permanently
  removed from "on hand".
- Moving an order back from Delivered/Completed releases the items back to stock.
