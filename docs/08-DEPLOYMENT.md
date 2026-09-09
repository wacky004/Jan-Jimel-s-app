# 08 — Deployment (Railway)

Single-service deploy via Nixpacks (`railway.json`).

## Steps

1. Push the repo to GitHub (`https://github.com/wacky004/Jan-Jimel-s-app`).
2. Railway → New Project → **Deploy from GitHub repo**.
3. Add a **PostgreSQL** plugin — Railway injects `DATABASE_URL` automatically.
4. Set service env vars (Settings → Variables):

| Variable | Value |
|---|---|
| `DJANGO_SECRET_KEY` | long random string (required) |
| `DJANGO_DEBUG` | `false` |
| `DJANGO_ALLOWED_HOSTS` | `your-app.up.railway.app` |
| `DJANGO_CORS_ORIGINS` | `https://your-app.up.railway.app` |

5. Deploy. `railway.json` handles:

- **build:** `npm install` (frontend) → `npm run build` (vite → `backend/frontend_dist`)
  → `pip install -r backend/requirements.txt` → `collectstatic`
- **start:** `cd backend && python manage.py migrate && python manage.py seed && gunicorn config.wsgi`

> `npm run build` works on Railway because the deploy path has no apostrophe
> (the local Windows folder does — see docs/10).

## First-run state

`seed` creates `superadmin` / `admin` (password `janjimels2026`) and syncs the
Pricelist 3 inventory. **Change those passwords immediately** (Admin → Users
creates new admins; delete the defaults afterwards).

## Post-deploy checklist

- [ ] Login as superadmin, change/remove default users
- [ ] Set the shop base (Admin → Delivery Map → Set shop base)
- [ ] Upload/assign item photos (Admin → Inventory → Edit → photo grid)
- [ ] Test one end-to-end flow: quotation form → reply + PDF → order → delivered → completed (inventory math)
- [ ] Verify RLS is active in Postgres (see docs/04 → psql checks)
- [ ] Confirm CORS/HTTPS: site loads over `https://*.up.railway.app`

## Health checks

- `/api/items/` → 200 (limited fields)
- `/api/orders/dashboard/` → 401 without token
- `/` serves the built SPA (Whitenoise root)
- Static assets `/assets/*.js|css`, `/images/*` → 200

## Rollback / DB

- Migrations run automatically at start; on Postgres they are transactional per migration.
- RLS can be reverted by migrating orders back to 0004 (`migrate orders 0004`)
  — the reverse drops policies and disables RLS.
