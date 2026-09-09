# 09 — Security

## Authentication & roles

- **JWT only** (SimpleJWT, Bearer header). Access 12h, refresh 7d.
- Tokens in `localStorage` (`jj_access`/`jj_refresh`); axios refreshes on 401.
- Roles: `super_admin` (create/delete admins, Users page) vs `admin`.
- No session-based API auth → the API is **CSRF-immune by design**
  (JWT + JSON + CORS allowlist; no cookies involved).

## Rate limits (DRF throttles)

| Scope | Rate | Applies to |
|---|---|---|
| `login` | 10/min per client | `/api/auth/login/`, `/api/auth/login/refresh/` |
| `quote` | 5/min | public quotation submission |
| `anon` | 100/min | all unauthenticated API calls |

## Input validation

- Login: `StrictLoginSerializer` — username ≤150 trimmed, password ≤128;
  oversized/missing input → 400 with field errors (no DB lookup);
  wrong credentials → identical generic 401 (no user enumeration).
- Admin register: password 6–128 chars.
- Frontend mirrors caps (`maxLength`) and shows a distinct 429 message.

## CORS / CSRF cookies

- `CORS_ALLOWED_ORIGINS` from `DJANGO_CORS_ORIGINS` (no wildcard);
  `CSRF_TRUSTED_ORIGINS` mirrors it for Django admin behind proxies.
- Cookies: `CSRF_COOKIE_SAMESITE=Lax`, `SESSION_COOKIE_SAMESITE=Lax`,
  `CSRF_COOKIE_HTTPONLY=True`, secure in prod.

## Data exposure rules

- Anonymous `GET /api/items/` → `PublicItemSerializer` (no stock levels, notes,
  condition, timestamps). Admin sees the full serializer.
- All business endpoints require auth; anonymous probing returns 401
  (verified test matrix in history).

## Production guards (`settings.py`)

- `DJANGO_DEBUG=false` **refuses to start** without `DJANGO_SECRET_KEY` and
  `DJANGO_ALLOWED_HOSTS`.
- Prod-only: HSTS 30 days, secure cookies, `SECURE_PROXY_SSL_HEADER`,
  same-origin referrer policy.

## Database security

- **Row-Level Security (PostgreSQL)**: forced on all business tables via
  migration `orders/0005_row_level_security` — only the app DB role has policy
  access; other roles are denied by default (see docs/04).
- App role separation is handled in Django (views/permissions); single tenant,
  so no per-row tenant keys.

## Secrets & code hygiene

- No API keys or credentials are embedded in the frontend bundle (verified by grep).
- Dev fallback `SECRET_KEY` is intentionally insecure but only used when
  `DEBUG=true`; production is guarded.

## Known accepted trade-offs / roadmap

| Item | Status |
|---|---|
| `localStorage` tokens (XSS-exposed) | accepted for this stack |
| CSP headers | not yet — planned hardening |
| HttpOnly-cookie auth | not yet — larger refactor |
| True multi-tenant row keys | documented enable path (docs/04) |
| `DJANGO_DEBUG=true` default locally | dev convenience; guarded in prod |

## Security test playbook

```powershell
# anonymous matrix → expect 401
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/orders/
# login brute force → expect 429 after 10
for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:8000/api/auth/login/ -H "Content-Type: application/json" -d '{"username":"superadmin","password":"nope"}'; done
# public item payload must NOT contain quantity_*
curl -s http://localhost:8000/api/items/ | head -c 400
# CORS
curl -s -H "Origin: https://evil.com" -D- -o /dev/null http://localhost:8000/api/items/ | findstr -i access-control
```
