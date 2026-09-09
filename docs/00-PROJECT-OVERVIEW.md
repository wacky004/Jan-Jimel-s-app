# 00 — Project Overview

**Jan & Jimels Party Needs** — event rentals & supplies business, Est. 1995.
#1/01 Pelota St., New St. Francis Village, San Juan, Cainta, Rizal.
Contacts: 0908-950-3879 · 0999-760-3211 · janjimels95@gmail.com.

## Problem being solved

The business previously recorded deliveries with pen & paper. This system:

1. Advertises the business online (3D animated landing page)
2. Lets customers request quotations (name + phone/email + event details)
3. Replaces paper with an order & delivery system (what items, how many, where)
4. Tracks rental inventory automatically (delivered → in-use, returned → back, missing → lost)
5. Pins deliveries on a free map (OpenStreetMap) with directions from the shop and per-customer trends
6. Generates branded quotation/delivery-order PDFs matching the business letterhead

## Feature map

| Area | Where | Docs |
|---|---|---|
| 3D landing page (React Three Fiber hero) | `frontend/src/pages/Landing.jsx`, `components/Hero3D.jsx` | 05 |
| Equipment & rates (live from inventory) | Landing + `/api/items/` | 05 |
| Customer quotation form (phone or email required) | `frontend/src/pages/Quotation.jsx` | 05 |
| Admin login (JWT, throttled) | `frontend/src/pages/Login.jsx`, `backend/accounts/` | 02, 09 |
| Orders & deliveries + returns | `frontend/src/pages/admin/Orders.jsx`, `OrderForm.jsx`, `backend/orders/` | 02, 04 |
| Inventory (Pricelist 3 sync, low stock) | `frontend/src/pages/admin/Inventory.jsx`, `backend/inventory/` | 02, 04 |
| Delivery map: pins, customer search, shop base, directions, trend badges, heatmap | `frontend/src/pages/admin/DeliveryMap.jsx` | 05 |
| Quotations: web requests + manual creation, line items, N/A pricing, PDF | `frontend/src/pages/admin/Quotations.jsx`, `backend/quotations/`, `frontend/src/pdf/quotePdf.js` | 05, 06 |
| Users & roles (super admin creates/deletes admins) | `frontend/src/pages/admin/Users.jsx`, `backend/accounts/` | 02 |
| Reports (CSV export) | `backend/orders/views.py` export endpoints | 03 |
| Dashboard | `frontend/src/pages/admin/Dashboard.jsx`, `GET /api/orders/dashboard/` | 03 |

## Quickstart

```powershell
# backend
cd backend
python -m venv .venv
.\.venv\Scripts\pip.exe install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed      # default users + Pricelist 3 inventory
.\.venv\Scripts\python.exe manage.py runserver 8000

# frontend (separate terminal)
cd frontend
npm.cmd install
node node_modules\vite\bin\vite.js             # http://localhost:5173
```

Default logins (change in production!): `superadmin` / `janjimels2026`,
`admin` / `janjimels2026`.

## Reading order for a new AI

00 (this file) → 01-ARCHITECTURE → 04-DATABASE → 03-API-REFERENCE → 09-SECURITY →
then topic-specific files (05 frontend, 06 PDF, 08 deployment, 10 workflow, 11 skills).
