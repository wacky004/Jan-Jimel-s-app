# 03 — API Reference

Base: `/api`. Auth: `Authorization: Bearer <access>`. Paginated lists: `{results: [...]}`.
Rate limits: anon 100/min · login 10/min · quotation submit 5/min.

## Auth — `/api/auth/`

| Method | Path | Auth | Throttle | Purpose |
|---|---|---|---|---|
| POST | `/auth/login/` | — | login 10/min | JWT login `{username, password}` → `{access, refresh}`. Errors: 400 field errors (missing/overlong), 401 generic, 429 throttled |
| POST | `/auth/login/refresh/` | — | login 10/min | `{refresh}` → `{access}` |
| GET | `/auth/me/` | ✓ | — | current user profile |
| GET | `/auth/users/` | ✓ | — | list users (non-super sees only self) |
| POST | `/auth/users/register/` | SA | — | create admin `{username, password, first_name, last_name, role}` |
| DELETE | `/auth/users/{id}/delete/` | SA | — | delete admin (not self, not Django superuser) |

SA = super admin role.

## Inventory — `/api/items/`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/items/` | — (limited fields) / ✓ (full) | list items; `?category=&search=&low_stock=true` |
| POST | `/items/` | ✓ | create item |
| GET/PUT/DELETE | `/items/{id}/` | ✓ | retrieve/update/delete |

Anonymous GET returns only: `id, name, category, category_display, rental_price, color, size, photo_url`.

## Orders — `/api/orders/`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/orders/` | ✓ | list; `?status=&search=&month=YYYY-MM` |
| POST | `/orders/` | ✓ | create order (nested `items[]`; item id or `custom_name`) |
| GET/PUT/DELETE | `/orders/{id}/` | ✓ | detail/update (PUT replaces items; status transitions run inventory sync) / delete |
| GET | `/orders/pins/` | ✓ | merged pins (orders + manual): coords, customer, contacts, status |
| POST | `/orders/pins/` | ✓ | create manual pin `{label?, address?, lat, lng, pin_date?, notes?}` |
| DELETE | `/orders/pins/{id}/` | ✓ | delete manual pin |
| GET | `/orders/customers/` | ✓ | merged customers (orders+pins); `?search=` filters, empty = all (cap 200) |
| GET/PUT | `/orders/shop/` | ✓ | shop base `{address, lat, lng}` |
| GET/POST | `/orders/routes/` | ✓ | delivery routes `?date=` (future day-routes; UI uses pins/directions) |
| GET/PUT/DELETE | `/orders/routes/{id}/` | ✓ | route detail with nested `stops[]` |
| GET | `/orders/dashboard/` | ✓ | stats: orders_total, orders_pending, orders_out_for_delivery, orders_delivered, deliveries_this_month, low_stock_count, items_total, revenue |
| GET | `/orders/export/orders.csv` | ✓ | CSV download |
| GET | `/orders/export/inventory.csv` | ✓ | CSV download |

Order payload shape (create/update):

```json
{
  "customer_name": "...", "contact_number": "...", "email": "",
  "event_type": "", "event_date": null, "event_time": null,
  "delivery_address": "...", "lat": "14.5758", "lng": "121.1182",
  "status": "pending", "delivery_date": null,
  "total_price": "0.00", "discount": "0.00", "deposit": "0.00", "notes": "",
  "items": [
    {"item": 1, "quantity": 10, "unit_price": "30.00", "quantity_returned": 0, "notes": ""},
    {"item": null, "custom_name": "Bubble Machine", "quantity": 1, "unit_price": "350.00"}
  ]
}
```

Statuses: `pending → confirmed → out_for_delivery → delivered → completed` (+ `cancelled`).
Frontend must send `event_date/event_time/delivery_date` as `null` when empty.

## Quotations — `/api/quotations/`

| Method | Path | Auth | Throttle | Purpose |
|---|---|---|---|---|
| POST | `/quotations/public/submit/` | — | anon + quote 5/min | customer request; forced `source=web, status=new` |
| GET | `/quotations/public/items/` | — | anon | limited item catalog for the public form |
| GET | `/quotations/` | ✓ | — | list; `?status=&source=web|manual` |
| POST | `/quotations/` | ✓ | — | create manual quotation (admin) |
| GET/PUT/DELETE | `/quotations/{id}/` | ✓ | — | detail/update (PUT replaces `items[]`; status writable) / delete |

Quotation item shape: `{description, quantity, unit_price, price_na}` →
`amount` is `null` when `price_na=true`.

## SPA fallback

Any other path (not `api/`, `admin/`, `static/`) serves `index.html`
(`config/urls.py` catch-all).
