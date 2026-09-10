# UI redesign baseline — Phase 0

## Scope and evidence

Baseline date: **2026-09-10**. Repository: `wacky004/Jan-Jimel-s-app`.
Baseline `main`: **`97dd8951e8d921994b3887894135c1fc125bc582`**.
Review branch: **`ui-redesign/phase-0-baseline`**.

Phase 0 records the existing application; it does not redesign or repair it. No
preceding phase exists. GitHub's latest `main` and both available local checkouts
matched the baseline commit; the selected checkout had a clean working tree.
Only this document is added. No application, configuration, dependency manifest,
lockfile, database, migration, photograph, or PDF implementation is changed.

Evidence labels used throughout:

- **S — source inspected:** behavior inferred from the baseline implementation;
  not a claim that the browser interaction passed.
- **A — API observed:** exercised against the unchanged Django application with
  an isolated, in-memory SQLite database and synthetic data. These observations
  do not establish production/PostgreSQL behavior or browser usability.
- **V — visual/keyboard verification pending:** browser rendering, screenshots,
  assistive technology, touch, and keyboard interaction were not verified.

All requested documentation, `App.jsx`, `index.css`, and all 16 files under
`frontend/src/pages/` and `frontend/src/components/` were read. The additional
AGENTS first-contact documents (architecture, database, API, security), development
workflow, auth/API helpers, image manifest, PDF implementation, and relevant
backend models/serializers/views were also inspected. Source governs descriptions
of current behavior when older documentation differs; this does not authorize
changing protected behavior.

## Brand and change boundaries

The **Brand Override** in
[`MASTER.md`](../design-system/jan-jimels-party-needs/MASTER.md) takes priority over
the generated palette, typography, and hover examples.

| Identity | Required value | Baseline implementation |
|---|---|---|
| Primary navy | `#14274D` | `navy-800` |
| Deep navy | `#071126` | `navy-950` |
| Gold | `#D4AF37` | `gold-500` |
| Light gold | `#F0D47A` | `gold-300` |
| Soft background | `#EEF2F9` | `navy-50` |
| Heading / body | Playfair Display / Poppins | Font tokens and Google Fonts in `frontend/index.html` |

The actual `navy-900` token is `#0C1A36`, although MASTER/docs describe
`navy-800/900` together as the primary navy. Record that difference; do not
silently normalize it in an unrelated phase. Generated purple/orange/Inter
examples are not the owner-approved identity.

Preserve every real business photo, including the 20 gallery images, the cover,
logo, equipment poster, pricelist images, and item-photo choices referenced by
[`images.js`](../frontend/src/images.js). Preserve source `images/` and served
`frontend/public/images/` assets. Layout changes may not replace the photographs
with stock or generated imagery.

Protected boundaries: API routes and request/response shapes; authentication/JWT;
models/migrations; admin roles and permissions; anonymous stock-data restrictions;
order/inventory calculations; security controls/rate limits; existing route paths;
PDF payload contracts. **Do not edit `frontend/src/pdf/quotePdf.js` without separate
authorization.** Existing defects below are observations, not permission to fix
business logic, routing, or API contracts during the UI redesign.

## Route and structure inventory

All entries below are **S** unless separately marked **A**. Client routing is in
[`App.jsx`](../frontend/src/App.jsx). `/` and `/quote` share fixed Navbar and Footer.
Paths beginning `/admin` omit the public shell. Unknown client paths redirect to `/`.

| Route | Access and structure | Current actions and behavior |
|---|---|---|
| `/` | Public. Full-height 3D hero; four static metrics; About; six service cards; 20-photo masonry gallery; equipment poster and live rates; four promise cards; contact/map embed; footer. | Quote CTAs to `/quote`; hash links to About/Services/Gallery/Rates/Contact; gallery buttons open a lightbox; phone/email links in footer. Rates show positive prices for five configured groups only. Metrics are marketing copy, not live inventory counts. |
| `/quote` | Public. Heading, expanded pricelist panel, customer details, event details, catalog picker, other-equipment entry, notes, submit; success panel replaces the form. | Toggle rates; download separate pricelist PDF; search items by name; toggle selection at quantity 1; plus/minus (zero removes); add/remove named custom equipment; require name and phone or email; submit composed request text. |
| `/admin/login` | Public standalone navy gradient with blurred shapes, centered translucent logo/card, username/password, Sign In, back link. | Native required inputs; username trimmed, maximum 150 characters; password maximum 128; autocomplete hints; successful login returns to `location.state.from` or `/admin`. |
| `/admin` | Authenticated admin shell: fixed desktop sidebar, sticky top bar, main outlet. Dashboard has six linked metric cards, two shortcut cards, CSV exports. | Pending/out-for-delivery cards carry status query strings; low-stock card carries `low_stock=true`; delivery card opens map; exports download orders/inventory blobs. |
| `/admin/orders` | Authenticated. Title/New Order; customer/address/contact search and status filter; seven-column table; New/Edit modal; separate detail/returns modal. | Row click fetches details; Edit opens list-row data; create/edit item and custom lines, dates, map pin, discount/deposit; advance status, edit returns, print PDF, delete with native confirmation. |
| `/admin/inventory` | Authenticated. Add Item; four summary cards; search/category/low-stock filters; eight-column table; item/photo editor modal. | Edit on-hand quantity, category, condition, variants, rate, threshold, notes and photo; delete with confirmation. Summary totals reflect the currently fetched/filter-matched page, not necessarily all inventory. |
| `/admin/map` | Authenticated. Wrapping toolbar; status legend; Leaflet map at `62vh`; customer/directions panel or location count; all-customers drawer; pin/shop modals; toast. | Customer/address search; manual pin; shop base/reset; status/month filters; heatmap; customer trend badges; select multiple locations; road directions/refresh/clear; delete manual pins. No day-route editor is present. |
| `/admin/quotations` | Authenticated. New Quotation; status/source filters; cards with Edit/PDF/Delete; editor modal with customer/event/status, line items, generated reply, PDF and save. | Catalog/custom lines, quantity/price and N/A; save manual quotes or edit web requests; download saved or unsaved PDF; delete with confirmation. Saving a reply records text; no email/SMS send action exists here. |
| `/admin/users` | Super-admin only. Create Admin; five-column table; create modal for names, username, password and role. | Role options include Admin and Super Admin; self-delete disabled; delete uses native confirmation. Ordinary admins are redirected to `/admin` by the route guard. |

The shell hides Users for ordinary admins. While authentication loads, the guard
shows `Loading…`; an unauthenticated visitor is redirected to `/admin/login`,
preserving only the pathname in `state.from` (not query/hash). A Suspense fallback
also shows `Loading…` while lazy admin code loads. Logout clears local tokens/user
state and navigates to login. No app-level error boundary or skip link is defined.

### Direct Django requests differ from client navigation

**A:** after the frontend build, Django test-client GET observations were:

| Direct request | Status | Observed destination |
|---|---|---|
| `/` | 200 | SPA HTML |
| `/quote` | 200 | SPA HTML |
| `/admin` (no trailing slash) | 200 | SPA HTML |
| `/admin/login` | 302 | `/admin/login/?next=/admin/login` |
| `/admin/orders` | 302 | `/admin/login/?next=/admin/orders` |
| `/admin/inventory` | 302 | `/admin/login/?next=/admin/inventory` |
| `/admin/map` | 302 | `/admin/login/?next=/admin/map` |
| `/admin/quotations` | 302 | `/admin/login/?next=/admin/quotations` |
| `/admin/users` | 302 | `/admin/login/?next=/admin/users` |

[`backend/config/urls.py`](../backend/config/urls.py) reserves `admin/` for Django
admin and excludes it from the SPA catch-all. Vite's client routes and client-side
navigation are therefore not equivalent to direct Django deep links. This is a
pre-existing routing issue; no path/fallback changes are authorized in Phase 0.
Later reviewers must test both navigation and hard reload on the actual deployment.

## Responsive baseline and screenshot status

The following breakpoint descriptions are **S**, not measured browser results.
Tailwind default breakpoints used here are `sm` 640, `md` 768, `lg` 1024, `xl` 1280.

| Area | 375px | 768px | 1024px | 1440px |
|---|---|---|---|---|
| Public navigation | Toggle menu | Full inline navigation begins; crowding risk | Full navigation | Full navigation, max-width container |
| Landing | One-column sections; 2-column stats/gallery; cover hidden in hero | 2-column services/promises, 3-column gallery, 4-column stats | Hero/About/Contact split; 3 service columns, 4 gallery/promise columns | Same desktop arrangement with capped widths |
| Quote | One-column fields/picker/rates | Two-column fields/picker/rates | Same in max-width 896px container | Same centered container |
| Login | Full width minus outer padding, inner padding 32px | Inner padding 40px; max-width 448px | Same | Same |
| Admin shell | Menu opens 256px overlay sidebar | Overlay sidebar; top-bar tagline visible | Fixed 256px sidebar and matching left padding | Fixed sidebar |
| Dashboard | One metric column | Two metric columns | Two metric columns; two shortcut columns | Three metric columns |
| Inventory | Four summary cards stack | Four summary columns | Four summary columns in narrower sidebar-adjusted space | Four summary columns |
| Quotations | One card column | Two card columns | Two card columns in sidebar-adjusted space | Three card columns |
| Map | Toolbar stacks/wraps; `62vh` map; customers drawer nearly full width | Toolbar wraps, drawer max 384px | Sidebar reduces map width | More toolbar room; map remains `62vh` |

Mobile and intermediate-width risks to verify:

- Navbar switches to all links at exactly 768px; logo, six links, gaps, and quote
  CTA may exceed available width. Mobile menu is fixed and overlays content.
- Landing has `overflow-x-clip`, which can conceal overflow rather than solve it.
  Hero has `pt-28`, quote has `pt-24`; hash targets lack `scroll-margin-top` and
  the document lacks `scroll-padding-top` for the fixed navbar.
- The 3D component's mobile condition is **coarse pointer**, not width. It reduces
  DPR/material complexity/shadows but still renders Canvas; there is no explicit
  photograph/static fallback for unsupported WebGL.
- Quote rate actions sit in an inner non-wrapping flex row. Selected item rows
  combine a 56px photo, name/details, and quantity controls without a small-screen
  stacked variant. Long names and active controls need overflow testing.
- At 1024px the admin sidebar appears and removes 256px of content width. Test
  this breakpoint directly; a wider viewport does not guarantee wider content.
- Order form line rows switch from stacked inputs to 12-column layout at 640px.
  The line-section heading/action group and order-detail footer have limited
  wrapping. Long customer titles, currency values and custom names need checks.
- Several modal overlays and the Orders modal body both scroll. Verify the sticky
  modal heading, last field, validation message and final actions with a mobile
  keyboard and zoom. No shared body-scroll lock is implemented.

### Tables

| Table | Minimum width / containment | Baseline usability problem |
|---|---|---|
| Orders list | 860px, `overflow-x-auto` wrapper | Actions on far right; customer context can leave view; detail row itself is not keyboard focusable. |
| Inventory list | 900px, `overflow-x-auto` wrapper | Eight columns remain on mobile; stock and actions require lateral scrolling. |
| Order returns | 560px, nested scroll wrapper inside modal | Returned inputs, missing counts, price and notes cannot all fit a phone; nested scroll interaction. |
| Users | 640px, `overflow-x-auto` wrapper | Delete actions offscreen on narrow views; no mobile alternative. |

These containers intend to contain horizontal scrolling. They do not prove the
document has no horizontal overflow. There are no dedicated mobile card views,
sticky identity/action columns, table captions or explicit keyboard instructions
for lateral scrolling. Quotation cards are not a table.

### Screenshot coverage

Frontend dependencies installed and Vite started at `127.0.0.1:5173`. The available
browser refused that address with **`net::ERR_BLOCKED_BY_CLIENT`**. No application
page rendered in that browser; no real screenshots were available to inspect or
commit. This is an environment limitation, not evidence that the application is
blank or broken. No fabricated screenshots, browser-error captures, or empty
placeholder image directory are committed.

| Required routes | 375px | 768px | 1024px | 1440px |
|---|---|---|---|---|
| `/`, `/quote`, `/admin/login` | V: blocked | V: blocked | V: blocked | V: blocked |
| `/admin`, `/admin/orders`, `/admin/inventory` | V: blocked | V: blocked | V: blocked | V: blocked |
| `/admin/map`, `/admin/quotations`, `/admin/users` | V: blocked | V: blocked | V: blocked | V: blocked |

To complete visual evidence in an accessible environment, use the baseline commit,
synthetic records and authorized local admin accounts. Capture each route's useful
initial viewport at widths 375, 768, 1024 and 1440; use height 900px consistently,
100% zoom, and record browser version, DPR, pointer type, font/tile availability and
motion preference. Capture a small number of additional examples: mobile open
navigation, populated returns modal, quote selected/custom/N/A lines, and map
customer/directions state. Scroll to reveal lazy content before a full-page
capture. Never resize a desktop image to represent a responsive layout.

Store useful reviewed images under `docs/ui-redesign/baseline/`, named for example
`orders-375-default.png` or `quote-768-selected.png`. Use an index with exact route,
viewport, fixture and capture state. Exclude credentials, tokens, real customer
records, developer panels and duplicate screenshots. These captures remain a
manual review task; this document is a source/API baseline, not a completed
visual baseline.

## Current interaction states

All states in this table are **S**. “None” means no explicit implementation found,
not that the workflow is impossible. Browser-native validation and confirmation
are distinguished from app-provided feedback.

| Page/workflow | Loading / empty / filtered-empty | Error, validation and retry | Confirmation / success |
|---|---|---|---|
| Landing/catalog | No catalog loader; absent/empty groups disappear. | Fetch failure swallowed; no retry or catalog-error message. No image-load error UI. | Lightbox closes by overlay/image click or Close; no save state relevant. |
| Public quote | No catalog loader or base-empty message; `No items match your search.` for filtered-empty. Submit disabled with `Sending your request…`. | Native required name/email-format checks; custom phone-or-email message; submission failure gives generic retry/call guidance, including 429. Retry is resubmitting retained form data; catalog has no retry. | No pre-submit confirmation; `Request Sent!`, customer/contact text and Back to Home replace form. No reset-for-another-request action. |
| Login / auth guard | `Signing in…` disabled submit; guard/Suspense `Loading…`. | Required inputs; 150/128 caps; `Too many attempts — please try again shortly.` for 429; every other failure becomes `Invalid username or password.` No field-linked error. Retry through Sign In. | Successful navigation; no separate success message. Logout immediate. |
| Dashboard / CSV | Missing numeric stats use ellipsis; revenue formats missing value as zero. Export disabled with `Downloading…`. | Stats failure swallowed, so ellipsis/zero may remain indefinitely. CSV uses `finally` without a visible error/retry state. | File download is success; no confirmation/toast. |
| Orders list/detail | `Loading orders…`; same first-order creation message for both empty and filtered-empty. No detail-fetch progress. | List failure exits loading without explicit error; detail failure swallowed; delete/status/returns lack visible error handling. Status updates optimistically before request success. | Native delete confirmation. Create/edit closes modal and reloads list; status/returns updates local items/status, no toast. No separate advance/completion confirmation. |
| Order form | Catalog failure swallowed; empty-line help with Add Item/Custom equipment; disabled `Saving…`. | Customer/contact/address, at least one line, line name/quantity checks; native numeric constraints; general save error. Can submit again. | Cancel/Close discard form without dirty-state confirmation; successful save closes modal. |
| Inventory | `Loading inventory…`; `No items found.` for empty or filtered-empty. Initial summaries zero. | Fetch/delete have no explicit error state. Editor validates name, uses numeric minima, displays generic save error; retry by saving again. | Native delete confirmation; editor closes and list refreshes on success. Photo selection/removal is immediate local form state. |
| Map / customers | `Loading pins…` overlay; `Loading customers…`; separate `No customers yet.` and `No customers match your filter.`; zero-location count; no-location customer guidance. | Pin-list failure has no dedicated error. Customer/address failures become empty results. Directions show `Getting route…`, then km/ETA or straight-line fallback with explanation and refresh action. | Native manual-pin delete confirmation; delete failure uses alert. Clearing customer/path and toggles act immediately. |
| Pin/shop forms / MapPicker | Disabled `Saving…`; MapPicker search has no busy/empty/error distinction. | Pin requires label or address; returned API errors flattened into message. Shop requires coordinates, generic save failure. MapPicker failures clear results. Save/search buttons are the retry mechanisms. | `✓ Pin saved!` and `✓ Shop base updated` toasts disappear after 3500ms; no live region. Cancel discards. Shop reset changes the draft until saved. |
| Admin quotations | `Loading quotations…`; same create-first message for empty/filtered-empty. Catalog failure produces empty catalog. Save disabled with `Saving…`. | Name required; generic save error; retry via Save. Editor is not a `<form>`, so numeric `min` attributes do not enforce native form submission validation. No visible list/delete/PDF failure state. | Native delete confirmation; create/save closes editor and reloads cards. Reply generation replaces draft text without confirmation. PDF is downloadable before saving. |
| Users | No list-loading, empty or retry UI; an empty/failing response can look like a blank table. Disabled `Creating…`. | Native required username/password; server username/password error or generic create error. Password min/max described by backend but not enforced with corresponding input attributes here. Delete failure uses alert. | Native deletion confirmation; self-delete disabled. Create closes modal, resets form and reloads table, no toast. |

Later phases should add relevant loading, empty, filtered-empty, validation,
error/retry, success and confirmation states without changing when/how mutations
occur. Retrying a mutation must not create duplicate orders/quotes or repeat stock
effects. The current app has no general retry framework.

## Accessibility and motion findings

Target for later UI work: WCAG 2.2 AA. These are **S** findings and audit leads;
they are not a complete conformance assessment.

| ID | Finding / evidence | Review implication |
|---|---|---|
| A11Y-01 | Most visible labels in Login, public Quote, OrderForm, Inventory and Users are sibling labels without `htmlFor`/matching `id`; admin quotation/map captions are often `<p>`. Search/filter/line controls rely on placeholders. | Associate every field with an accessible name; test label clicks and screen-reader names. Wrapped low-stock/heatmap/N/A checkbox labels already provide an association. |
| A11Y-02 | Validation messages have no `role=alert`, live region, field `aria-describedby`, `aria-invalid`, or focus-to-error behavior. Success panels/toasts are not announced. | Test errors, retained values, keyboard focus, and async status announcement. |
| A11Y-03 | Custom modals, gallery lightbox and drawers have no dialog semantics, focus trap, initial focus, Escape handler, focus restoration or background inertness. | Keyboard can remain outside the overlay; verify Close/Cancel, focus containment and returning to trigger. |
| A11Y-04 | Orders details are opened by a `<tr onClick>` with no keyboard equivalent; the available Edit button opens a different workflow. Map manual pin depends on pointer coordinates. | Provide keyboard access to details/returns/PDF and an equivalent location-selection path in an authorized UI phase. |
| A11Y-05 | Item-photo buttons contain empty-alt images and no explicit name. Remove/quantity buttons use only symbols. Catalog toggle lacks `aria-pressed`; mobile menus lack expanded/control relationships; map mode/rates toggles lack state semantics. | Use meaningful names and expose selection/expanded state; do not rely on a symbol or color alone. |
| A11Y-06 | `:focus-visible` gold outline exists; input classes use `outline-none` and pale gold focus rings. Small close/remove/line controls need target-size measurement. | Verify focus remains visible on each background and not behind sticky/fixed UI; assess WCAG 2.2 target-size/spacing exceptions, not a blanket 44px requirement. |
| A11Y-07 | No skip link or public `<main>`; one static document title for every route; no route-focus management. Hash targets have no header offset. | Test bypassing navigation, page context, reading order and focus not obscured. |
| A11Y-08 | Light gold text/focus treatments and small navy-300/400 text on light surfaces warrant contrast checks. | Token-pair calculations below show concrete risks; rendered opacity/background combinations still require measurement. |
| A11Y-09 | Generic gallery alt text uses numbered event setups; footer/sidebar/login logo alt is only `logo`. Images often omit intrinsic width/height. | Review useful image descriptions and loading stability while preserving real photographs. |
| A11Y-10 | Noninteractive service cards move/lift on hover and suggest clickability. Map fly-to lasts 1 second with no reduced-motion branch. | Remove prohibited hover movement in a later UI phase; inspect Leaflet movement separately from CSS/Framer settings. |

Calculated opaque sRGB contrast against white (source token arithmetic, not a
rendered browser audit): gold-500 `#D4AF37` **2.10:1**, gold-600 `#B8952A`
**2.85:1**, navy-300 `#84A0D0` **2.65:1**, navy-200 `#B3C5E3` **1.75:1**,
navy-400 `#5478B8` **4.42:1**. Compare normal text with 4.5:1 and applicable
large-text/UI boundaries with 3:1. Preserve brand colors while choosing accessible
foreground/background uses; these ratios do not mean every use of gold fails.

### Hover movement and transition inventory

| Source at baseline | Existing effect |
|---|---|
| `Landing.jsx:220,455,557` | Quote CTAs `hover:scale-105`. |
| `Landing.jsx:345` | Service cards `hover:-translate-y-1.5`. |
| `Landing.jsx:385` | Gallery image `group-hover:scale-105`, 500ms transition. |
| `Dashboard.jsx:70` | Metric cards `hover:-translate-y-0.5`. |
| `Quotations.jsx:294` | Quotation cards `hover:-translate-y-0.5`. |

These are visual movement/overlap risks prohibited by the redesign rules; CSS
transforms alone do not prove document reflow or measurable layout shift (CLS).
No `whileHover` handler was found in the inspected pages/components. The hero cover
has a static perspective rotation, not a hover effect. Most shared transitions
use Tailwind's default 150ms; Navbar uses 300ms. Framer entrance/reveal timings span
400–900ms and gallery hover uses 500ms, outside the requested 150–300ms range.

Reduced-motion support already includes CSS animation/transition shortening,
smooth-scroll disabling and `MotionConfig reducedMotion="user"`. Hero3D reads
motion preference at module load, disables sparkles, skips scene/table motion,
and selects demand rendering. Float wrappers remain present; dynamic preference
changes, any continuing opacity effects, offscreen rendering and Leaflet
animations need actual verification. Do not claim motion compliance from CSS alone.

### Emoji and text-symbol icon inventory

Line references apply to the baseline commit. Ordinary currency signs, numeric
counts, separators, and missing-value dashes are data/text, not all replacement
targets. Existing inline SVGs use hand-written paths with several stroke widths;
Leaflet uses CSS/HTML markers and image icons. A consistent SVG family is a later
UI task; do not convert icons in Phase 0.

| File | Occurrences / purpose |
|---|---|
| `Landing.jsx` | `✓` trust indicators at 233/236/239. |
| `Login.jsx` | `←` Back to website at 105. |
| `Quotation.jsx` | `⬇` pricelist 237; `🔍` search 349; `+ Add` custom action; `✕` remove 436; `✓` selection 499; `−`/`+` quantity 517/528. |
| `Dashboard.jsx` | `⬇` CSV download at 148 (shared by two buttons). |
| `Orders.jsx` | `+ New Order`; `🔍` search 78; `📍` table/detail 135/257; `→` next status 323; `🖨` PDF 337. |
| `OrderForm.jsx` | `+ Add Item`, `+ Custom equipment`; `✕` remove at 272. |
| `Inventory.jsx` | `+ Add Item`; `🔍` search 103; `✕ Remove photo` 302. |
| `Users.jsx` | `+ Create Admin`. |
| `Quotations.jsx` | `＋` new/empty guidance 268/289; `✕` delete/remove 343/485; `+ Add line`; `✦` custom 404/430; `↩` list 449; `✍` reply 510; `⬇` PDF 531. |
| `DeliveryMap.jsx` | `✓` success 377/440; `🔎` search 482; `📞`/`✉` contact 501/729–730/790–791; `📌` save 516; `📍` result/trend/pin/count 543/600/881/1020; `✔`/`🖐` manual mode 568; `🏠` shop 574; `👥` customers 587; `✔` trend 611; `🎉` event 734; `📅` date 746; `↻`/`🧭` directions 823; `✕` close 844; `🔍` drawer filter 994. `JJ` shop and `×N` trend markers are text/data representations to review separately. |

## API calls and payload-sensitive workflows

[`api.js`](../frontend/src/api.js) uses axios `baseURL: '/api'`. Paths below show
the actual intended endpoints. Most paginated list consumers accept
`data.results || data`, but expose no next-page control (default page size 100).
The public quote catalog, map pins and customer endpoints return arrays.

| Consumer | Calls / query handling | Contract-sensitive details |
|---|---|---|
| Auth provider/login | POST `/api/auth/login/`; GET `/api/auth/me/`; POST `/api/auth/login/refresh/` through raw axios | Login sends `{username,password}`; tokens stored as `jj_access`/`jj_refresh`; request interceptor attaches Bearer token. On 401 with a refresh token, retry original request once; failed refresh clears tokens and redirects. Without refresh, reject. Preserve role checks, caps and 429 handling. |
| Landing | GET `/api/items/` | Uses `results || data`; groups slug `category`; only positive rental rates in chairs/tables/linens/tents/glassware shown. No stock values rendered. |
| Public quote | GET `/api/quotations/public/items/`; POST `/api/quotations/public/submit/` | Array catalog; selected IDs become name/quantity text, not nested inventory objects. See exact payload below. Public endpoint forces `source=web,status=new`. |
| Dashboard | GET `/api/orders/dashboard/`; CSV exports | Stats keys: `orders_total`, `orders_pending`, `orders_out_for_delivery`, `orders_delivered`, `deliveries_this_month`, `low_stock_count`, `items_total`, `revenue`. Revenue is delivered/completed order totals. Export buttons pass `/api/orders/export/orders.csv` and `/api/orders/export/inventory.csv` into the `/api`-based client; verify base joining (see known discrepancies). |
| Orders list/detail/form | GET `/api/orders/?status=&search=` (250ms debounce); GET detail; POST collection; PUT/DELETE `/api/orders/{id}/`; form GET `/api/items/` | Status is URL search state; typing search is local. Form sends full scalar/nested data. Detail status/returns also send full order and items, not only changed fields. |
| Inventory | GET `/api/items/?category=&search=&low_stock=true` (250ms debounce); POST; PUT/DELETE `/api/items/{id}/` | Edit spreads full fetched item; numeric editor values can be strings. Changing category replaces query params; unchecking low stock clears all query params. Summaries derive from fetched results. |
| Map | GET `/api/orders/pins/?status=`; GET `/api/orders/shop/`; GET `/api/orders/customers/?search=` or unfiltered; POST pins; DELETE pin; PUT shop | Month filtering is local; date fallback is `delivered_at || event_date || created_at`. Pin identity is `source-id`, not bare ID. Manual pins remain in API results under order status filters. |
| Admin quotations | GET `/api/items/`; GET `/api/quotations/?status=&source=`; POST collection; PUT/DELETE `/api/quotations/{id}/` | Filters local, not URL state. Editor cleans nested lines and excludes blank descriptions. Manual creation source is set by backend. Saving `items` replaces all nested items. |
| Users | GET `/api/auth/users/`; POST `/api/auth/users/register/`; DELETE `/api/auth/users/{id}/delete/` | Create shape `{username,password,first_name,last_name,role}`. Ordinary admin list returns only self; create/delete require super-admin role; backend also blocks self/Django-superuser deletion. |

### Public quotation payload

Shape is `{name,phone,email,event_type,event_date,venue,items_requested,message}`.
Empty `event_date` becomes `null`. `items_requested` joins selected catalog lines
(`name xquantity`), other-equipment lines (`Other equipment: name xquantity`), and
free-text notes with newline separators. `message` remains a separate field even
though the visible notes textarea edits `items_requested`. Name uses native
required validation; phone-or-email is enforced by the client submit handler.
Do not silently add nested quote lines, prices, IDs or inventory data to this payload.

**A:** anonymous `/api/items/` returned exactly `id,name,category,category_display,
rental_price,color,size,photo_url`. Never add quantities, condition, threshold,
notes, timestamps or other admin-only item details. The other public catalog uses
display labels in `category`, not the inventory slug (observed `Chairs`). Preserve
both existing contracts.

### Order writes and calculations

Order fields include `customer_name,contact_number,email,event_type,event_date,
event_time,delivery_address,lat,lng,status,delivery_date,total_price,discount,
deposit,notes,items`. Preserve blank dates/times as null and coordinate string/null
normalization. Line payloads preserve `item` or nullable `item` plus `custom_name`,
`quantity,unit_price,quantity_returned,notes`. Form-only `custom` currently remains
in the spread line object; do not opportunistically refactor its payload here.

The form computes subtotal as sum of quantity × price; `total_price` is subtotal
minus discount, formatted with `toFixed(2)`; balance is total minus deposit.
Do not subtract discount twice, convert blank dates to empty strings, discard
returned counts during edit, or substitute public catalog objects for item IDs.
The backend model balance is `total_price - deposit`.

The detail view sends `{...order,items,status}` with PUT. Nested lines are replaced
by the backend before inventory transition logic runs. Its local items/status
refresh after success but the original `order` object remains the source for
other detail fields and PDF metadata. Preserve these inputs; record stale-data
risks rather than changing request semantics.

### Quotation editor, map, and external services

Admin quote writes contain `name,phone,email,event_type,event_date,venue,
items_requested,message,status,reply,items`. Clean lines are exactly
`{description,quantity,unit_price,price_na}`; numbers are normalized, N/A forces
unit price to zero, blank descriptions are dropped, `event_date` defaults to null.
UI-only `mode,item_id` do not go to the backend. N/A amounts are null and excluded
from priced totals. Reply generation uses the first name, line summary, total
and payment terms; saving an empty reply generates text but does not send it.

Manual pin POST sends `{label,address,lat,lng,pin_date,notes}` with trimmed label;
shop PUT sends `{address,lat,lng}`. A map pin is not a new order. Route CRUD APIs
(`/api/orders/routes/` and detail, with nested `stops`) exist but the current UI
does not call them. Do not introduce day-route saving while restyling the map.

External requests: OpenStreetMap tiles/embed; Nominatim address search/reverse
geocoding; OSRM driving routes; Google Fonts; MapPicker's exported Leaflet image
icon points at unpkg (the active picker uses its gold HTML marker). OSRM request
coordinates are **longitude,latitude**; returned geometry is converted to
**latitude,longitude** for Leaflet. Directions failures display a labeled straight
line, not a reliable road distance/ETA. Preserve these distinctions and retries.

## Regression cases for later phases

Run mutation cases only against disposable synthetic development data. Compare
requests, stored results and UI state, not only screenshots. **A** below indicates
the stated backend observation passed during Phase 0; every browser aspect is **V**.
**S/V** cases are source-backed review cases that have not been executed end to end.

### Routes, auth, public pages and permissions

| ID | Steps / expected invariant | Evidence |
|---|---|---|
| REG-01 | Open all nine routes via links, direct URLs, reload and Back/Forward; compare public/admin shells; unknown client route returns home. Preserve path/query behavior and known Django deep-link discrepancy. | S/V; direct Django results A above |
| REG-02 | Anonymous admin navigation goes to login; successful login returns to requested pathname. Ordinary admin cannot open Users; super-admin sees it. | S/V |
| REG-03 | Anonymous GET orders, item detail, pins, customers, shop, routes, dashboard, quotations and users returns 401. Normal admin can authenticate and GET self; cannot register users (403). | A |
| REG-04 | Check missing/overlong/wrong login inputs, username whitespace, password whitespace, 429; expired access with valid refresh retries once; expired refresh clears login; logout removes access. Never weaken throttles (login 10/min, quote 5/min, anon 100/min). | S/V |
| REG-05 | Anonymous item list contains only the eight allowed fields; public quote catalog also exposes no stock. Preserve photos, labels and rental rates, including zero-price handling. | A allowed fields/category; S/V visual |
| REG-06 | Submit phone-only and email-only quote, reject neither in UI; select/deselect, decrement to zero, add custom quantity and notes, clear optional date. Request text/order and field names remain unchanged. Failure retains input; success replaces form once. | S/V; forced web/new A |
| REG-07 | Gallery opens each real image and closes; anchor targets visible below navbar; no photo replaced or dropped. Phone/mail links remain functional. | S/V |
| REG-08 | Super-admin create/delete; ordinary admin denied; self-delete and Django-superuser protections survive. Test field errors, success refresh and confirmation cancellation. | S/V; ordinary registration denial A |

### Order lifecycle and inventory

Required normal flow: **Pending → Confirmed → Out for Delivery → Delivered → Completed**.
`cancelled` remains an existing alternate status, not an extra normal-flow step.

| ID | Case / expected baseline | Evidence |
|---|---|---|
| INV-01 | Start on-hand 100/in-use 0; create Pending with quantity 10; Confirmed and Out for Delivery leave 100/0/100 (on-hand/in-use/available). | A |
| INV-02 | Enter Delivered: on-hand remains 100, in-use 10, available 90; inventory flag true and delivery timestamp assigned by backend. Repeated Delivered save must not double-apply. | A quantities/repeat; S timestamp/flag logic |
| INV-03 | Return 8 of 10 then Complete: in-use 0, on-hand/available 98, missing loss 2; saved returned count remains 8. | A |
| INV-04 | All 10 returned then Complete: on-hand 100, in-use 0. Zero returned: on-hand 90, in-use 0. Boundary return counts need UI/server checks; do not add business rules in redesign. | S/V |
| INV-05 | Save return edits while Delivered without changing status: stock unchanged until completion. Refresh/reopen retains counts. Missing value clamps to nonnegative in backend. | S/V |
| INV-06 | Delivered → Pending/Confirmed/Out for Delivery/Cancelled releases in-use with no loss deduction; flag cleared. Later delivery re-applies exactly once. | S/V |
| INV-07 | Completed with loss → Pending leaves on-hand 98/in-use 0. Lost pieces are not restored by current implementation, despite older docs' broader rollback wording. | A |
| INV-08 | Custom item (`item:null`, named equipment) can deliver/complete without touching catalog stock. Display name, quantities and custom badge must survive edit/PDF. | A stock; S/V UI/PDF |
| INV-09 | Mixed inventory/custom lines, repeated inventory item, changed quantities/item IDs, removed lines, same-status Delivered edits, repeated Complete, reopen and delete Delivered orders. Compare stock and returned values before/after; see existing edge risks below. | S/V |
| INV-10 | Create directly as Delivered: order is created, inventory is not applied and flag is false. Keep this pre-existing behavior out of UI-only fixes; normal-flow regression uses Pending creation. | A |
| INV-11 | Subtotal 100, discount 10, total 90, deposit 20 gives balance 70. Preserve decimals, totals and PDF values; exercise zero discount/deposit and custom prices. | A backend balance; S/V form/PDF |
| INV-12 | Inventory available is `max(on_hand-in_use,0)`; low stock at available <= threshold. Edit name/rate/photo/condition/variant, combine filters, cancel deletion, reject referenced-item deletion. No public stock exposure. | S/V |

### Quotations, maps and exports

| ID | Case / expected invariant | Evidence |
|---|---|---|
| FLOW-01 | Manual quote with priced quantity 2 × 10 plus an N/A line returns amount 20.00 and null, source manual. Public create forces web/new even if other source/status supplied. | A |
| FLOW-02 | Edit saved quote, switch catalog/custom, zero rate auto-N/A, toggle N/A off/on, remove/reorder lines, generate/edit reply, save and reopen. Preserve blank-line omission, quantities and full nested replacement. Test no-contact manual quotation separately from public form validation. | S/V |
| FLOW-03 | Filter web/manual and new/replied/closed; compare initial-empty vs filter-empty; delete/cancel; list refresh after create/update. Catalog failure must not rewrite saved descriptions. | S/V |
| FLOW-04 | Search/select customer, choose alternate pin, draw/refresh/clear directions; verify lat/lng ordering, km/min, shop source and fallback note when OSRM fails. | S/V |
| FLOW-05 | Save pin by search and manual click, validate label/address, cancel, delete/cancel; edit shop location/reset then cancel/save; missing customer location guidance and all-customers filtered-empty. | S/V |
| FLOW-06 | Preserve source-qualified marker IDs; status/month filter behavior; heatmap; trend `×N` is pin count per case-insensitive customer name, with separate distinct-location count rounded to four coordinate decimals. | S/V |
| FLOW-07 | Download both authenticated CSV reports; verify exact request URL, file name, header columns, custom display names, financial/stock values and failure state. Current base-path issue is recorded below. | S/V |

## PDF contract and regression matrix

PDF generation is client-side. Read-only references:
[`docs/06`](06-PDF-GENERATION.md),
[`quotePdf.js`](../frontend/src/pdf/quotePdf.js),
[`Quotations.jsx`](../frontend/src/pages/admin/Quotations.jsx),
[`Orders.jsx`](../frontend/src/pages/admin/Orders.jsx), and
[`Quotation.jsx`](../frontend/src/pages/Quotation.jsx). No PDF was generated or
visually compared in Phase 0. All PDF cases are **S/V**.

| Entry point | Payload / distinct behavior |
|---|---|
| Admin quote card PDF | `downloadQuotationPdf({id,date,name,phone,email,address,event_type,event_date,venue,items})`; `address` uses venue. If stored items absent, nonempty `items_requested` lines become quantity 1/price 0/non-N/A lines. |
| Admin quote editor PDF | Same mapper, but current unsaved `selected`/`items`; a new quote has null ID. Downloading does not create/save a quotation. |
| Order detail Print PDF | `downloadOrderPdf({id,date,customer_name,contact_number,email,event_type,event_date,event_time,delivery_address,status,items,total_price,discount,deposit,balance})`; current local items plus original order metadata. Lines display `description || item_name || 'Item'`. |
| Public Download Pricelist | Separate generator inside `Quotation.jsx`, not `quotePdf.js`; live grouped catalog, fixed group order, names and rates; filename `Jan-Jimels-Pricelist.pdf`. |

| ID | Comparison case |
|---|---|
| PDF-01 | Saved quotation: A4 portrait, correct name/contact/venue/date/lines; `QUOTATION NO.: JJ-` padded ID; filename `Quotation-{id}-{name-with-hyphens}.pdf`. |
| PDF-02 | Unsaved quotation: reference line omitted, no `DRAFT`; download must not save. Current filename includes `null` for a new quote; record rather than silently alter. |
| PDF-03 | Mixed priced/N/A lines: N/A unit/amount text; exclude N/A from total; all-N/A and empty items produce total N/A; numeric zero-price non-N/A remains priced zero. |
| PDF-04 | Catalog/custom names, descriptions with color, long descriptions, blank optional event/contact fields; maintain supplied quantities/unit rates and fallback mapping from request text. |
| PDF-05 | Delivery order: current items/custom names, event time and delivery address; use supplied total/balance. Discount/deposit rows appear only when positive. Do not recompute total or subtract discount twice. |
| PDF-06 | Header overlap: divider x=108mm; right zone x=116–198mm; short left tagline, logo and contact block must stay within their zones. Preserve navy/gold letterhead and signature. |
| PDF-07 | Multipage lines: repeated table header after row breaks, stripe/readability, every-page footer, totals and payment/terms/signature not clipped. Include a very long final description and enough rows to push totals near bottom. |
| PDF-08 | Logo fetch failure, image decode failure and lazy jsPDF load failure; record actual error behavior. Fetch/FileReader errors are not caught by the later addImage catch. |
| PDF-09 | Money uses `P 1,234.00` in branded PDFs rather than unsupported peso glyph. Verify decimals, commas, long names/addresses and filename behavior. |
| PDF-10 | Public pricelist groups/rates and page breaks match actual API-driven content; empty catalog/zero rates/long item names and download failure. Existing category mismatch must not be mistaken for a redesign regression. |
| PDF-11 | Save returns/advance status then print without reopening vs after reopening: compare locally updated items with stale original metadata. Printed status is passed even though the current generator does not render it. |

## Known discrepancies and pre-existing risks

These are **not repaired**. Use them to avoid attributing existing problems to a
later phase, while treating desired fixes as separately scoped work.

| ID | Current evidence and implication |
|---|---|
| BASE-01 | **A+S:** public quote catalog `category` is a display label such as `Chairs`, but `PRICELIST_GROUPS` indexes slug `chairs`. Selected-item groups use the returned labels and can populate; the rate panel/PDF fixed-group lookup skips unmatched groups. |
| BASE-02 | **A:** direct Django `/admin/...` requests are handled by Django admin, unlike React navigation; hard-refresh behavior requires deployment review. |
| BASE-03 | **S:** Dashboard export supplies `/api/orders/...` to a client already based at `/api`; axios treats leading-slash paths as relative to this base combination, risking `/api/api/orders/...`. Validate before blaming later styling. |
| BASE-04 | **A+S:** inventory sync runs on update, not create; direct Delivered creation does not apply stock. Same-status updates exit early; changing Delivered line quantities therefore does not reconcile stock. Nested replacement precedes transition logic. |
| BASE-05 | **A+S:** leaving Completed does not restore missing stock. Order destroy uses generic deletion with no inventory-release override. Delivered deletions and changed/removed lines are separate accounting-risk cases, not authorized UI fixes. |
| BASE-06 | **S:** `saveShop` updates shop state then invokes a route callback from the existing render; initial route refresh may use the previous shop. Saving a customer pin reloads data, then selection can use the old render's `pins`. Address prefill calls search immediately after state update. These need runtime reproduction. |
| BASE-07 | **S:** public quote phone-or-email requirement is in the UI handler; the backend serializer does not enforce that cross-field condition. Do not describe it as a backend rule or change it here. |
| BASE-08 | **S:** branded PDF `drawBlocks` has no page-space guard; fixed event boxes and customer lines may overflow with long text; table checks current y before considering an unusually tall next row. Fetch failure is outside addImage's catch despite older docs claiming a general logo fallback. |
| BASE-09 | **S:** docs describe static mobile hero/full route fitting more broadly than implementation: coarse pointer still uses Canvas; `fitRoute` is defined but unused. Tray/scene motion and whole road geometry visibility need browser verification. |
| BASE-10 | **S:** no UI pagination despite paginated lists; some failures are swallowed or leave stale/empty data; inventory filter changes may discard other filters. These affect comparisons with larger datasets. |

## Checks and execution record

Required checks ran on unchanged application source using the repository lockfile
and Python requirements. Node was **24.19.0**, Vite **8.2.2**. A temporary Python
virtual environment installed `backend/requirements.txt` and used
`backend/manage.py` with the repository's `config.settings`. No secrets/settings
were committed. Initial missing-dependency failures were resolved by installation;
the final outcomes below supersede those setup failures.

| Check | Final result |
|---|---|
| `node node_modules/oxlint/bin/oxlint src` in frontend | **PASS**, exit 0; 22 pre-existing warnings. |
| `node node_modules/vite/bin/vite.js build` in frontend | **PASS**, exit 0; 1296 modules transformed; existing >500kB chunk warning (main JS about 1,410kB uncompressed). Generated `backend/frontend_dist` excluded from commit. |
| `python manage.py check` in backend, using temporary venv with repository requirements/settings | **PASS**, exit 0: `System check identified no issues (0 silenced).` |
| Isolated Django/DRF API probes | **PASS**, 32 assertions; normal JWT login, 401/403 permissions, public item fields/category, order lifecycle/full PUT round trips, repeated delivery, partial returns/loss, direct-delivery create behavior, custom stock exclusion, quote source/N/A, balance and deletion. Nine direct Django route observations recorded. |
| Browser screenshots, keyboard, zoom and four-width rendered audit | **BLOCKED**, browser refused localhost. No visual, assistive-technology or PDF-rendering pass is claimed. |
| Existing automated test files | `accounts`, `inventory`, `orders`, `quotations` tests are scaffolds with no test cases; temporary API probes are observations, not a new committed regression suite. |

Lint warning breakdown: 6 Fast Refresh mixed-export warnings, 4 synchronous
set-state-in-effect warnings, 2 ref-access-during-render warnings and 10 unused
variable/parameter warnings. They occur in ui/auth/MapPicker/Hero3D and quote/order/
map pages. No warning was introduced or fixed by this documentation-only phase.

The isolated API probes used real JWT requests in the test client with ephemeral
credentials held in memory. Only the test process's database target was replaced
with in-memory SQLite; no production data, fixture accounts, credentials or probe
scripts are committed. Synthetic stock setup for reproduction: on-hand 100,
in-use 0, order quantity 10, returned 8, total 90, discount 10, deposit 20; advance
by full PUT through the normal lifecycle, repeat Delivered, then Complete and
return to Pending. Expected quantities and edge cases are listed above. PostgreSQL
RLS, real external map services, JWT expiry/throttle timing and production hosting
were not runtime-tested.

## Manual comparison procedure for every later phase

1. Confirm this phase is merged before starting Phase 1; later phases likewise
   start only after their predecessor is merged. Record base/new SHA and use a
   dedicated `ui-redesign/phase-N-short-name` branch. Do not merge automatically.
2. Use the same synthetic fixture set and baseline commit. Cover guest, ordinary
   admin and super-admin; initial/empty/filtered-empty, pending requests, validation,
   failed request/retry, success and confirmation-cancel states.
3. At 375/768/1024/1440px, inspect all nine routes; verify no document-level
   horizontal scroll, accessible horizontal table regions, visible fixed-nav
   targets, long content, modal final actions and mobile sidebar behavior.
4. Use Tab/Shift+Tab/Enter/Space/Escape through navigation, forms, item selection,
   detail/returns, dialogs and drawers. Check focus visibility/restoration, field
   naming/error associations, screen-reader announcements, 200% zoom/reflow and
   reduced-motion behavior. Record unverified cases explicitly.
5. Execute relevant REG/INV/FLOW/PDF cases above. Capture only sanitized evidence;
   never commit network dumps with authorization headers or real customer data.
6. Compare API paths, methods and payload keys/types to this baseline. Review
   changed files for auth/permission/security/stock/route/PDF-contract drift and
   verify `frontend/src/pdf/quotePdf.js` and all business photos remain unchanged.
7. Run lint, production build and Django check; separate pre-existing warnings and
   baseline defects from new failures. Add phase-specific evidence only where the
   change introduces a real regression risk.
8. Review the final diff, commit and push all completed phase work, open a PR and
   report branch, SHA, link, files, checks, limitations and manual steps. Stop at
   the requested phase.

Phase 0 preserves API, authentication, permissions, inventory/order behavior,
routes, security controls and PDF contracts. The outstanding visual evidence is
explicitly recorded rather than represented as completed testing.
