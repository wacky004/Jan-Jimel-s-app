# 05 — Frontend

React 19 + Vite 8 + Tailwind CSS 4 + Framer Motion + React Three Fiber.
Deps: axios, react-router-dom 7, leaflet + react-leaflet 5 + leaflet.heat,
jspdf (lazy-loaded), three + @react-three/fiber + @react-three/drei.

## File map

```
src/
  main.jsx            entry; StrictMode + index.css
  App.jsx             router, AuthProvider, MotionConfig(reducedMotion="user"),
                      lazy admin pages, public layout (Navbar/Footer)
  api.js              axios instance (baseURL /api), JWT interceptor + refresh-on-401
  auth.jsx            AuthProvider: user state, login/logout, /auth/me on boot
  images.js           ITEM_PHOTO_OPTIONS (event photos for the inventory photo picker)
  index.css           Tailwind v4 @theme: navy-*, gold-* tokens; fonts; reduced-motion CSS
  components/
    Hero3D.jsx        photoreal banquet hero (R3F): PBR materials, offline Environment
                      (Lightformers), SoftShadows/ContactShadows, champagne tower,
                      balloons; mobile fallback; static under prefers-reduced-motion
    MapPicker.jsx     search (Nominatim) + click-to-pin mini map (used in order form,
                      shop base, pin flows)
    Navbar.jsx / Footer.jsx / ui.jsx (StatusBadge, inputs, formatPHP/DateTime)
  pages/
    Landing.jsx       3D hero, stats, about, services (SVG icons), gallery, equipment
                      & rates (live /api/items), why-us, contact + OSM embed, lightbox
    Quotation.jsx     public quote form: Pricelist rate sheet (live, downloadable PDF),
                      item picker with photos + "Other equipment", submit → POST
    Login.jsx         admin login (trim, maxLength, 429 message)
    admin/
      AdminLayout.jsx  sidebar nav + user card + logout (Users link = super admin only)
      Dashboard.jsx    stats cards + CSV export buttons
      Orders.jsx       order table (search/status), OrderForm modal (MapPicker, custom
                       equipment), OrderDetail modal (returns, status advance, PDF)
      OrderForm.jsx    create/edit order; items with inventory dropdown + custom rows
      Inventory.jsx    item table (low stock, filters), item form incl. photo picker grid
      DeliveryMap.jsx  single-view map: customer search + side panel ("All customers"),
                       save pin (search/manual), shop base modal (MapPicker),
                       auto road directions (OSRM) + fit-to-route, trend toggle
                       (per-customer ×N badges), heatmap, status/month filters
      Quotations.jsx   list (source badges + filters), New Quotation editor with
                       pricelist dropdown + Custom items + N/A lines, reply generator,
                       Download PDF
      Users.jsx        create/delete admins (super admin)
  pdf/quotePdf.js      branded quotation + delivery-order PDFs (see docs/06)
```

## Routing

| Path | Page | Access |
|---|---|---|
| `/` | Landing | public |
| `/quote` | Quotation form | public |
| `/admin/login` | Login | public |
| `/admin` (index) | Dashboard | auth |
| `/admin/orders` | Orders | auth |
| `/admin/inventory` | Inventory | auth |
| `/admin/map` | Delivery Map | auth |
| `/admin/quotations` | Quotations | auth |
| `/admin/users` | Users | **super admin** |
| `*` | redirect `/` | public |

## Auth flow

1. `Login` → `auth.login()` → POST `/auth/login/` → tokens to `localStorage`
   (`jj_access`, `jj_refresh`)
2. `api.js` request interceptor adds the Bearer header; response interceptor
   refreshes once on 401 (`/auth/login/refresh/`) or clears + redirects to login
3. `Protected` in `App.jsx` gates `/admin*`; `superOnly` gates Users

## Theming (Tailwind v4)

`index.css` `@theme` tokens: `navy-50..950`, `gold-300..700`,
`--font-display: Playfair Display`, `--font-body: Poppins`.
Global helpers: `.font-display`, `.text-gradient-gold`, leaflet sizing,
reduced-motion kill-switch, gold focus-visible rings, `button { cursor: pointer }`.

## Delivery Map behaviors (DeliveryMap.jsx)

- **Pins:** merged order+manual pins; popups show contacts/totals; manual pins deletable
- **Customer search:** `/orders/customers/`; selecting highlights pins, pans, and
  **auto-draws** the OSRM road route from the shop base (fitBounds to show the whole
  path, distance + ETA shown)
- **All customers side panel:** full customer list (empty search), filter box
- **Trend toggle:** one gold ×N badge per customer name (latest pin, distinct-location
  count) — the "most ordered places" view; works with heatmap
- **Shop base:** modal with MapPicker (search list + click-to-pin), saved to
  `/orders/shop/`
- **Pin saving:** address search (Nominatim results) or manual click; label optional
  (customer name tip), full address goes in the address field

## Public quotation form (Quotation.jsx)

- Loads public catalog (`/quotations/public/items/`)
- Rate sheet panel mirrors Pricelist 3 groups; "Download Pricelist (PDF)" via jsPDF
- Item rows show `photo_url` thumbnails with ✓ badges; "Other equipment" free-text add
- Submit requires phone **or** email

## Build output

`vite build` → `backend/frontend_dist` (hashed assets + `public/images/*`).
`WHITENOISE_ROOT` serves it at `/` in production; Vite dev server proxies `/api`.
