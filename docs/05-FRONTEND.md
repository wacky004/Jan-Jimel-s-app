# 05 — Frontend

React 19 + Vite 8 + Tailwind CSS 4 + Framer Motion + React Three Fiber.
Deps: axios, react-router-dom 7, leaflet + react-leaflet 5 + leaflet.heat,
jspdf (lazy-loaded), three + @react-three/fiber + @react-three/drei, lucide-react.
Dev/test: vitest + @testing-library/react + jsdom, oxlint.

> The public site was redesigned (ChatGPT, PRs #1–#4). See `docs/UI-DESIGN-SYSTEM.md`
> (semantic `--ui-*` tokens, component contracts) and `docs/UI-REDESIGN-BASELINE.md`
> (regression matrix). `docs/UI-REDESIGN-PHASE-3.md` covers the accessible three-step
> quotation wizard (`components/quotation/*`), which posts the same payload to
> `/quotations/public/submit/`.
>
> **Landing page:** the owner prefers the original "DeepSeek" landing — `pages/Landing.jsx`
> + the photoreal 3D hero in `components/Hero3D.jsx` were restored from commit `97dd895`
> (anchors carry `scroll-mt-24` for the fixed navbar). The ChatGPT `public/*` landing
> components (LandingSections, HeroScene, public.css) remain in the repo but are no
> longer used by the landing; `Gallery`/`Rentals` still have component tests.

## File map

```
src/
  main.jsx            entry; StrictMode + index.css
  App.jsx             router, AuthProvider, MotionConfig(reducedMotion="user"),
                      lazy admin pages, RouteFocus, skip link, public layout
  api.js              axios instance (baseURL /api), JWT interceptor + refresh-on-401
  auth.jsx            AuthProvider: user state, login/logout, /auth/me on boot
  images.js           ITEM_PHOTO_OPTIONS = EQUIPMENT_PHOTO_OPTIONS (8 catering item photos
                      from images/equipment/, see images/equipment/SOURCES.md for licenses)
                      + the 20 event photos + equipments poster
  index.css           Tailwind v4 @theme: navy-*, gold-* tokens + semantic --ui-* tokens
  hooks/useMediaQuery.js   responsive-mode helper (hero adaptive mode)
  components/
    public/           public-site redesign: HeroScene (R3F), LandingSections, Gallery,
                      Rentals, navigation.js, galleryData.js, QuoteLink, public.css
    ui/primitives.jsx, ui/overlays.jsx   semantic UI components (re-exported via ui.jsx)
    ui.jsx            StatusBadge + legacy input/label/btn*/format helpers
    MapPicker.jsx     search (Nominatim) + click-to-pin mini map
    Navbar.jsx / Footer.jsx / RouteFocus.jsx
    Hero3D.jsx        legacy hero (kept; public site now uses public/HeroScene.jsx)
  pages/
    Landing.jsx       original "DeepSeek" landing: 3D hero (Hero3D), stats, about,
                      services (SVG icons), gallery + lightbox, equipment & rates
                      (live /api/items), why-us, "Registered & Trusted" (DTI/BIR
                      document cards with click-to-enlarge; BIR TIN masked via a
                      proportional overlay), contact + OSM embed; anchors use
                      scroll-mt-24 for the fixed navbar
    Quotation.jsx     public quote form: rate sheet + PDF + item photos + Others
    Login.jsx         admin login (TextField/Button + FormErrorSummary; trim, maxLength, 429)
    admin/            AdminLayout (skip link/focus), Dashboard, Orders, OrderForm,
                      Inventory, DeliveryMap, Quotations, Users
  pdf/quotePdf.js      branded quotation + delivery-order PDFs (see docs/06)
tests/                 vitest suites (public-site, ui) — run `node node_modules\vitest\vitest.mjs run`
vitest.config.js       jsdom environment + setup file
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
