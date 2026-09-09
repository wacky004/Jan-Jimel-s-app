# AGENTS.md — Project Guide for AI Agents

This file is the entry point for any AI agent working on this repository.
Read it first, then follow the references below.

## What this project is

**Jan & Jimels Party Needs** — a website + business management system for an
event-rental business (chairs, tables, linens, tents, décor, sound, glassware)
in Cainta, Rizal, Philippines (Est. 1995).

Public site: 3D animated landing page, equipment & rates, and a customer
quotation request form. Admin portal: orders/deliveries (replaces pen & paper),
inventory with stock tracking, delivery map (pins, directions, trends),
quotations (reply + branded PDFs), user management (super admin / admin).

## Repository map

```
backend/                  Django 5.2 + DRF + SimpleJWT API (see docs/02-BACKEND.md)
  config/                 settings.py, urls.py (SPA catch-all + API routes)
  accounts/               custom User (role field), JWT login (throttled), register/delete
  inventory/              Item model, seed_pricelist command (Pricelist 3 items)
  orders/                 Order/OrderItem/ShopSettings/DeliveryPin/DeliveryRoute/RouteStop,
                          inventory sync state machine, customers/pins/shop/routes/dashboard/CSV
  quotations/             Quotation/QuotationItem, public submit + admin list/create/update
frontend/                 React 19 + Vite 8 + Tailwind 4 (see docs/05-FRONTEND.md)
  src/pages/              Landing, Quotation, Login, admin/* (Dashboard, Orders, Inventory,
                          DeliveryMap, Quotations, Users)
  src/components/         Hero3D (React Three Fiber scene), MapPicker, Navbar, Footer, ui
  src/pdf/quotePdf.js     branded quotation + delivery-order PDF generator
  src/api.js, auth.jsx    axios instance, JWT token storage + refresh interceptor
images/                   source photos (logo, pricelist 3, equipments, event gallery)
.opencode/skills/         installed AI design skills (see docs/11-SKILLS-EXTENSIONS.md)
design-system/            generated design system + brand override (docs/07-DESIGN-SYSTEM.md)
docs/                     00..11 project documentation (read in order on first contact)
railway.json              Railway build/deploy config (docs/08-DEPLOYMENT.md)
```

## First-contact reading order

1. `docs/00-PROJECT-OVERVIEW.md`
2. `docs/01-ARCHITECTURE.md`
3. `docs/04-DATABASE.md`
4. `docs/03-API-REFERENCE.md`
5. `docs/09-SECURITY.md`
6. Everything else as needed for the task.

## Invariants — never break these

1. **Inventory state machine** (`orders/serializers.py` → `apply_inventory_on_status_change`):
   - `delivered` → `quantity_in_use += qty`, `inventory_applied=True`, `delivered_at=now`
   - `delivered → completed` → `in_use -= qty`, `on_hand -= missing` (permanent loss)
   - leaving delivered/completed releases items back
   - Custom items (`item IS NULL`, `custom_name`) never touch stock.
2. **Public item data is limited**: anonymous `GET /api/items/` uses `PublicItemSerializer`
   (no `quantity_*`, `notes`, `condition`, timestamps). Never add stock fields to it.
3. **Auth is JWT** (Bearer) + role checks (`super_admin`/`admin`) in views. Login is
   throttled 10/min. No session-based API auth exists.
4. **PostgreSQL RLS is forced** on all business tables (migration
   `orders/0005_row_level_security`) — SQLite no-ops. Do not remove `FORCE ROW LEVEL SECURITY`.
5. **Public rate limits**: anonymous 100/min, quotation submit 5/min. Keep throttle scopes.
6. **Production refuses to boot** without `DJANGO_SECRET_KEY` + `DJANGO_ALLOWED_HOSTS`
   when `DJANGO_DEBUG=false`.
7. PDFs are generated client-side by `frontend/src/pdf/quotePdf.js` (jsPDF). The header is
   two-zone (divider at x=108) — do not widen the tagline or right-zone text past the divider.

## Conventions

- Python: PEP8, no comments unless they clarify *why*; models use explicit `related_name`.
- Frontend: Tailwind v4 tokens (`navy-*`, `gold-*`), `font-display` (Playfair) / `font-body`
  (Poppins); components in `src/components`, admin pages in `src/pages/admin`.
- API responses paginated (DRF `PAGE_SIZE=100`); frontend handles `data.results || data`.
- Money is PHP, formatted client-side (`formatPHP`, `P 1,234.00` in PDFs).

## Local commands (Windows note!)

The folder name contains an apostrophe — **npm scripts fail**. Run vite directly:

```powershell
# backend
cd backend
.\.venv\Scripts\python.exe manage.py runserver 8000
# frontend (dev server on 5173, proxies /api to 8000)
cd frontend
node node_modules\vite\bin\vite.js
# build for production (served by Django/Whitenoise)
node node_modules\vite\bin\vite.js build
```

See `docs/10-DEVELOPMENT-WORKFLOW.md` for the full command set.

## Before finishing any task

- Run `node node_modules\oxlint\bin\oxlint src` (frontend) and `python manage.py check` (backend)
- Rebuild with vite if frontend changed
- Push to `origin main` only if the user asked to save/push
