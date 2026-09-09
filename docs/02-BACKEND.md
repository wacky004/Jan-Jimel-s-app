# 02 — Backend

Django 5.2 + Django REST Framework + SimpleJWT. Packages: `requirements.txt`
(Django, djangorestframework, djangorestframework-simplejwt, django-cors-headers,
dj-database-url, whitenoise, psycopg[binary], gunicorn).

## Apps

### accounts
Custom `User(AbstractUser)` with a `role` field: `super_admin` | `admin` (models.py).

- `LoginThrottledView` (TokenObtainPairView subclass) — uses `StrictLoginSerializer`
  (username ≤150 trimmed, password ≤128) and `ScopedRateThrottle` scope `login` (10/min)
- `RefreshThrottledView` — same scope
- `MeView` — current user (auth)
- `UserListView` — super admin sees everyone; plain admins only themselves
- `RegisterView` / `UserDeleteView` — super admin only (`IsSuperAdmin`),
  cannot delete self or Django superusers

### inventory
- `Item`: name, category (chairs/tables/linens/covers/tents/sound_light/decor/glassware/other),
  `quantity_on_hand`, `quantity_in_use`, condition, color, size, `rental_price`,
  `low_stock_threshold`, `photo_url`, notes. Computed: `quantity_available`,
  `is_low_stock` (models.py).
- `PublicItemSerializer` — anonymous GET exposes only
  id/name/category/category_display/rental_price/color/size/photo_url. **Never add
  stock fields to it** (invariant).
- `ItemSerializer` — full admin payload.
- `ItemListCreateView.get_serializer_class()` picks public vs admin by auth.
- `seed_pricelist` management command — upserts the official Pricelist 3 items
  (Chairs 30/180/80 · Tables 70/200/160/200/150/200 · Linen & Décor 15/30/10/10 ·
  Outdoor Tent 1500 · Equipment: Plates, Utensils, Chafing Dish, Serving Tray,
  Soup Bowls, High-Ball Glass, Wine Glass, Pitcher); `--clean-legacy` deletes old
  items only when they have no orders.

### orders
Models: `Order`, `OrderItem` (nullable `item` + `custom_name` → custom equipment),
`ShopSettings` (singleton shop base), `DeliveryPin`, `DeliveryRoute`, `RouteStop`.

Views (all `IsAuthenticated`):
- `OrderListCreateView` — filters `?status=&search=&month=`
- `OrderDetailView` — retrieve/update/destroy (PUT replaces items; status changes
  run the inventory sync)
- `DeliveryPinsView` — GET merges order pins + manual pins; POST creates manual pin
- `DeliveryPinDeleteView`
- `CustomerSearchView` — merges Orders + DeliveryPins by name; empty search returns
  the full deduplicated customer list (capped 200)
- `ShopSettingsView` — GET/PUT shop base address+coords
- `DeliveryRouteListCreateView` / `DeliveryRouteDetailView` (kept for future day-routes;
  the UI currently uses pins + directions instead)
- `DashboardView` — counts, monthly deliveries, low stock, revenue
- `OrdersCsvView` / `InventoryCsvView` — CSV exports

#### Inventory sync state machine (`serializers.py:apply_inventory_on_status_change`)
| Transition | Effect |
|---|---|
| any → `delivered` | each item `quantity_in_use += qty`; `inventory_applied=True`; `delivered_at=now` |
| `delivered` → `completed` | `in_use -= qty`; `on_hand -= missing` (permanent loss) |
| `delivered` → anything else | release: `in_use -= qty` |
| `completed` → `delivered` | re-deduct full qty (loss already applied) |
| custom items (`item IS NULL`) | never touch stock |

### quotations
Models: `Quotation` (`status`: new/replied/closed; `source`: web/manual) and
`QuotationItem` (`description`, `quantity`, `unit_price`, `price_na` — amount is
None when price N/A).

- `PublicQuotationCreateView` — AllowAny, throttle scopes `anon` + `quote` (5/min),
  forces `source=web`, `status=new`
- `QuotationListCreateView` — auth GET (filters `?status=&source=`) and POST
  (admin-created manual quotations)
- `QuotationUpdateView` — retrieve/update/destroy (PUT replaces items, status writable)
- `PublicItemsView` — limited catalog for the public quote form

## Settings highlights (`config/settings.py`)

- DB: `DATABASE_URL` → Postgres (Railway); else SQLite
- DRF: JWT only, `PAGE_SIZE=100`, throttles `anon 100/min · login 10/min · quote 5/min`
- CORS allowlist from `DJANGO_CORS_ORIGINS`; `CSRF_TRUSTED_ORIGINS` mirrors it;
  SameSite=Lax cookies; CSRF cookie HTTPONLY
- Production guards: `DEBUG=false` requires `DJANGO_SECRET_KEY` + `DJANGO_ALLOWED_HOSTS`
  or startup fails; HSTS 30d, secure cookies, same-origin referrer
- Whitenoise: `WHITENOISE_ROOT = backend/frontend_dist` serves the built SPA at `/`

## Management commands

- `seed` — default users + shop settings + Pricelist 3 sync (idempotent)
- `seed_pricelist [--clean-legacy]` — inventory ↔ Pricelist 3

## Migrations

`accounts/0001`, `inventory/0001-0002`, `orders/0001-0005`
(0005 = row-level security, see docs/04-DATABASE.md), `quotations/0001-0003`.
