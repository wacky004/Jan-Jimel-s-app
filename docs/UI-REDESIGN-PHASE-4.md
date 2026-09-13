# Phase 4 — Admin foundation and responsive listings

## Scope and starting point

Phase 3 [PR #4](https://github.com/wacky004/Jan-Jimel-s-app/pull/4) was merged into `main` at `1a8bc267650bca8feae5ca92a13a4d95ae93ebc7` before creating `ui-redesign/phase-4-admin-foundation`. This phase changes admin navigation, dashboard presentation and the Orders, Inventory, Quotations and Users listings. Compare against [the baseline](UI-REDESIGN-BASELINE.md).

Large forms, detail dialogs and Delivery Map are deferred. Existing forms/dialogs receive only relevant Lucide icon replacements and an accessible name for removing a quotation line. Their fields, save handlers, calculations and PDF mappings are preserved.

## Navigation and shared patterns

| Group | Link | Route |
| --- | --- | --- |
| Overview | Dashboard | `/admin` |
| Operations | Orders & Delivery | `/admin/orders` |
| Operations | Delivery Map | `/admin/map` |
| Sales | Quotations | `/admin/quotations` |
| Catalog | Inventory | `/admin/inventory` |
| Administration | Users, super admins only | `/admin/users` |

`AdminLayout.jsx` retains the existing role test, logout operation and login destination. `App.jsx`, including the Users route guard and every route definition, is unchanged. The sidebar is visible from 1024px; smaller screens use the Phase 1 native modal `Drawer` with an accessible title/description, expanded/control attributes, initial close-button focus, Tab trapping, native Escape/cancel handling, background inertness, scroll locking and focus restoration. Route or desktop-breakpoint changes unmount/reset the mobile menu. If its trigger disappears on desktop resize, focus moves to main content. The main target and global skip link remain available. Navigation focus uses a light-gold ring against the inverse surface.

New files under `frontend/src/components/admin/`:

- **`AdminUI.jsx`:** `AdminPageHeader`, labelled `AdminFilters`, `AdminListState` and `AdminListing`. Later phases should pass existing record data, column renderers and action handlers into these presentation components. Each error retry retains filters; filtered-empty clear actions restore a useful focus target.
- **`useAdminData.js`:** shared loading/error/retry state for the existing GET URL and `data.results || data` response handling. Superseded/unmounted requests cannot replace the active result. Orders and Inventory retain their 250ms search debounce. No pagination, additional parameters, new endpoints or authentication behavior are introduced.
- **`admin.css`:** scoped page, sidebar, filter, metric, table and card styles using the navy/gold semantic tokens, visible focus, wrapping text/actions and 200ms color transitions. No hover translation, scale or continuous decorative animation is added; the existing global reduced-motion rules apply.

`AdminListing` mounts one representation: tables at **1024px and 1440px**, cards below 1024px (including **375px and 768px**). Tables have captions, column headers and row headers. Cards retain the same column information and actions in headings/description lists. Only one set of actions is in the accessibility tree. Mobile Orders, Inventory and Users no longer render their old minimum-width tables. Desktop tables use fixed layout and wrapping cells rather than forcing a document-wide overflow.

## Listing content and feedback

| View | Preserved visible information/actions | New feedback |
| --- | --- | --- |
| Dashboard | Six existing metrics/deep links, order/quotation quick links and both CSV exports | Skeleton, load failure/retry, zero-activity explanation, export progress/success/failure/retry |
| Orders | Customer/contact, event/date, full address/map-pin indicator, piece count, total, status, View and Edit | List states; explicit keyboard View action replaces row click; detail-load failure/retry |
| Inventory | Name/variants, low-stock badge, category, on-hand/in-use/available, condition, rate, Edit/Delete; existing summary arithmetic | List states; summaries withheld while loading/failed; delete failure message |
| Quotations | Name/contact, event/date/venue, equipment/N/A descriptions, status, source, received date, Edit/PDF/Delete | List states; local search; delete failure message |
| Users | Name/current-user marker, username, role, joined date, Delete; self-delete remains disabled | List states; local search and role filter |

All four lists distinguish loading, unfiltered-empty, filtered-empty, failure and retry. A result count is announced after loading. Filters have labels, active-filter text and Clear filters. The dashboard has no filter controls, so a filtered-empty dashboard state does not apply. Successful zero-valued metrics remain visible alongside the empty explanation; failures do not show misleading zero revenue.

All interface icons in the six modified views use Lucide SVGs. Text separators, missing-value dashes and quantity notation remain text. All original photo assets are unchanged, including the navigation logo and inventory photo picker.

## Query and API compatibility

| View | Existing request and filter behavior retained |
| --- | --- |
| Dashboard | `GET /orders/dashboard/`; pending → `/admin/orders?status=pending`, delivery → `/admin/orders?status=out_for_delivery`, low stock → `/admin/inventory?low_stock=true`; remaining links retain their destinations |
| Orders | `GET /orders/?` with optional `status`, then `search`; status is read from URL search parameters; changing status replaces URL parameters as before; text search remains local state controlling the request |
| Inventory | `GET /items/?` with optional `category`, `search`, `low_stock=true`; URL-backed category/low-stock controls and original reset semantics retained |
| Quotations | `GET /quotations/?` with optional `status`, then `source`; these filters remain component state rather than newly added URL parameters. Existing editor catalog GET `/items/` is retained. New text search filters names/contact/venues in the loaded records without changing requests |
| Users | `GET /auth/users/`; new name/username search and role filtering are local to loaded records; no new request parameters |
| Exports | Existing `/api/orders/export/orders.csv` and `/api/orders/export/inventory.csv` calls with `{ responseType: 'blob' }`, original filenames and blob data |

Clear filters resets the existing list controls/search. Inventory's baseline quirks are intentionally retained: changing category replaces other URL filters, enabling low stock preserves current parameters, and disabling low stock clears parameters. Tests explicitly preserve these semantics. The baseline's CSV base-path concern is also unchanged: those `/api/orders/...` URLs are supplied to the existing axios client based at `/api`, so deployment verification is still needed for the possible duplicated prefix. Failure is now reported with a retry action instead of an unhandled rejection.

Existing pagination limitations remain: list responses are still consumed as before without a new pagination UI. Users/Quotations search is explicitly described as searching loaded records, not the entire server dataset. Inventory summaries still aggregate the returned records with the original calculations.

Order detail GET, deletion, form create/update operations, quotation save payloads, user registration/deletion, and inventory mutations retain their endpoints and contracts. The entire order-detail state/return/status/PDF handler block, inventory summary/save block, quotation edit/save/reply/PDF mapping block and Users submit/delete block were compared against the base source. `frontend/src/pdf/quotePdf.js`, `OrderForm.jsx`, Delivery Map, API client, auth, routes, backend, packages and public pages are unchanged.

The lifecycle remains **Pending → Confirmed → Out for Delivery → Delivered → Completed**. Inventory stock changes, custom-item exclusions, missing-item deductions, totals, JWT, super-admin permissions, anonymous stock restrictions, rate limits, RLS and other security controls are unchanged. No customer data, credentials, generated build files or screenshots are included.

## Verification

Run from `frontend/`:

```sh
node node_modules/oxlint/bin/oxlint src
node node_modules/vite/bin/vite.js build
node node_modules/vitest/vitest.mjs run
```

Run from `backend/` with the prepared repository environment:

```sh
/workspace/scratch/35615cf40747/baseline-venv/bin/python manage.py check
```

Final results: lint passes with existing warnings; Vite build passes with the existing large-chunk warning; Django reports no issues; **66 tests across five files pass**. The 30 new admin tests cover all four list states/retries, four-width representation selection and primary actions, explicit keyboard order opening/detail retry, exact filters/query semantics, stale-response rejection, local Users/Quotations search, self-delete protection, quotation PDF data, dashboard zero/error/deep links, CSV error/success URL/blob/filename, mobile navigation grouping/role visibility, focus trap/restoration and route/viewport reset. The 36 prior public quotation, public site, shared UI and actual-App route/permission tests remain passing. `git diff --check` and source comparisons pass.

**Rendered browser verification remains blocked.** The supervised preview started, but the browser refused `http://terminal.local:4173/admin` with `net::ERR_BLOCKED_BY_CLIENT`. No screenshots or rendered-width pass are claimed. Width tests mock media queries and verify the chosen semantic representation/content; they do not measure overflow or contrast. JSDOM dialog tests simulate native cancel and do not establish actual top-layer inertness, physical touch behavior, browser Escape dispatch or screen-reader output. No live business mutation/export or visual PDF inspection was performed. Existing accessibility limitations inside the deferred forms/detail dialogs remain outside this phase.

## Manual review before merge

1. At **375, 768, 1024 and 1440px**, open Dashboard, Orders, Inventory, Quotations and Users (as super admin). Verify readable cards/tables, complete information and all actions, wrapping long names/addresses, no document-level horizontal scrolling, fixed-header clearance and usable layout at 200% zoom. Check the 768px two-column cards and the narrower 1024px sidebar/table combination carefully.
2. Use Tab/Shift+Tab/Enter/Space through grouped navigation and filters. Open the mobile drawer, check initial focus, Escape, focus trap/restoration, backdrop interaction prevention, scrolling, route changes and desktop/mobile resize. Confirm ordinary admins cannot see Users or enter `/admin/users` and logout behaves as before.
3. Follow every Dashboard metric link. Confirm Pending, Out for Delivery and Low Stock select the expected list filter and request. Test search, combined filters, active indicators, clear, URL reload and browser Back/Forward; compare the inventory reset behavior above.
4. Simulate delayed, failed and empty GETs for every list and dashboard; retry. Test unmatched filters and clear. Verify errors are announced, filters retained, stale filter responses ignored and loading/error dashboard data does not display as zero revenue.
5. Open an order with the explicit View button using only the keyboard. Retry a failed detail request. Confirm Edit still opens the existing form. Exercise the baseline lifecycle/returns/custom-stock cases with disposable development records and compare mutations/calculations.
6. Verify inventory/user delete confirmation cancellation, self-delete protection and server rejection. Create/edit using the deferred forms and check payloads/list refresh without redesigning those forms.
7. Download both CSVs; inspect their original filenames/columns/data and error/retry feedback, including the baseline URL concern. Download a saved and unsaved quotation PDF and an order PDF; compare payloads and output using the baseline PDF matrix.
8. With a screen reader and reduced-motion enabled, verify headings, current navigation, filter labels, result/error announcements and named row actions. Smoke-test the unchanged public routes and Delivery Map within the new shell. Stop after Phase 4.
