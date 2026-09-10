# Phase 3 — Public quotation experience

## Scope and prerequisite

Phase 2 PR [#3](https://github.com/wacky004/Jan-Jimel-s-app/pull/3) was merged into `main` at `85e7462bcb38ea7dd45691929b12e9fedc997413` before this work began. Phase 3 uses `ui-redesign/phase-3-public-quotation` and stops at the public quotation experience. Compare with [the baseline](UI-REDESIGN-BASELINE.md) and [shared component guidance](UI-DESIGN-SYSTEM.md).

`/quote` now contains three internal steps:

1. **Event details:** optional event type, date and venue.
2. **Equipment selection:** searchable catalog, category filter, selected quantities, custom equipment and additional notes.
3. **Contact details and review:** required full name, phone or email, and a review of event details, contact methods, catalog quantities, custom entries and notes before submission.

No step adds a URL. Back and completed-step controls preserve all form values, selections, custom entries, the custom-entry draft and catalog filters. An unsent custom name must be added or cleared before continuing, so it cannot silently disappear from the submitted request. Empty equipment and undecided event details remain allowed.

## Component ownership

| File under `frontend/src/` | Responsibility |
| --- | --- |
| `pages/Quotation.jsx` | Form state, steps, existing API calls, validation, submission and post-render focus |
| `components/quotation/Details.jsx` | Event/contact fields, notes and final review |
| `components/quotation/Equipment.jsx` | Catalog feedback/filtering, selected quantities and custom equipment |
| `components/quotation/PriceList.jsx` | Responsive disclosure and download feedback |
| `components/quotation/downloadPricelist.js` | Extracted existing price-list renderer |
| `components/quotation/quotationData.js` | Existing options/groups, category mapping, validation and payload assembly |
| `components/quotation/LeaveGuard.jsx` | Router navigation confirmation and browser unload warning |
| `components/quotation/quotation.css` | Scoped responsive presentation using Phase 1 navy/gold tokens |

Two minimal shared integrations support the flow:

- `App.jsx` replaces the `BrowserRouter` wrapper with `createBrowserRouter` / `RouterProvider`, which supplies the data-router context required by the installed React Router's supported `useBlocker` API. The original descendant `<Routes>` definitions and `Protected` function remain unchanged. `AuthProvider` still wraps the router. Existing public and admin paths, redirects and permission guards have regression coverage.
- `FormErrorSummary` accepts an optional `onFieldFocus(fieldId)` callback. Quotation uses it to mount the step containing a server-rejected field before focusing that field. Consumers without this prop retain the existing behavior.

Later changes should keep request state in the parent, preserve the field IDs and payload helper, and use the shared field primitives to maintain label, hint and error associations. Focus requests run after the target step has rendered and the submitting fieldset has been re-enabled.

## Feedback and accessibility

| Situation | Behavior |
| --- | --- |
| Catalog loading | Labelled skeleton; download unavailable until public data is loaded |
| Catalog failure | Error and explicit retry; custom equipment and notes remain usable |
| Empty catalog | Explanation and guidance to add custom equipment |
| No search/category matches | Distinct empty message and clear-filter action; selections retained |
| Validation | Field errors, `aria-invalid`, associated help/errors and linked error summary; first invalid field receives focus |
| Server field errors | Relevant step opens; summary links can reach errors on other steps |
| Submission | Busy announcement, disabled editing/navigation and duplicate-submit guard |
| Submission failure | All data retained; retry by submitting again; separate rate-limit guidance |
| Submission success | Focused confirmation heading, contact method, next steps and home link |
| Leaving unsent work | Shared confirmation dialog for router navigation, including browser Back; browser-native warning for unload/reload |
| Download | Preparing, failure/retry and success messages |

The progress list marks the current step with `aria-current="step"`; a live status announces the step name and number. Quantity buttons and inputs identify their equipment. All new action icons are Lucide SVGs. Text quantity separators are content, not substitute interface icons. Existing catalog photos remain displayed; no image assets are removed or generated.

At widths below 768px the full price list defaults to collapsed. Wider screens default to expanded; an explicit toggle choice takes precedence on resize. The form is a single column on narrow screens, with wrapping action groups, 44px shared controls, 16px inputs and fixed-navigation scroll offsets. The design inherits shared focus and reduced-motion rules; it adds no decorative animation or transform hover effect. Its color transitions use the existing 200ms token and accessible dark-gold text token on light surfaces.

## API and PDF compatibility

The axios client and its `/api` base URL remain unchanged. Only the same public requests are made:

- `GET /quotations/public/items/` — existing direct array response; retry repeats this request.
- `POST /quotations/public/submit/` — existing eight-field JSON object, with no step, category, inventory, price, ID-list or contact-method fields added.

Example payload, using illustrative customer/equipment values:

```json
{
  "name": "Example Customer",
  "phone": "09000000000",
  "email": "",
  "event_type": "Birthday",
  "event_date": null,
  "venue": "Example venue",
  "items_requested": "Chair x12\nOther equipment: Podium x1\nBlue theme",
  "message": ""
}
```

`items_requested` still joins catalog lines (`Name xquantity`), custom lines (`Other equipment: Name xquantity`), then the free-text notes with newline separators. It preserves the existing object-entry ordering and `Item` fallback. Blank date still becomes `null`; the existing unused `message` key remains an empty string. Full name is required, phone **or** email is required, and event/equipment fields remain optional. Client validation reflects existing backend length limits and valid whole equipment quantities; it does not alter server validation or calculations.

Catalog presentation reads only the existing public ID, name, category, rental price, photo URL, color and size. No protected quantities, conditions, internal notes or timestamps are requested or displayed. Category display labels returned by the backend (for example `Tents & Canopies`) are mapped locally to existing group keys (`tents`), also accepting the original keys. This fixes previously omitted display-label categories in grouped prices without altering catalog records, rental prices, the response contract or the submission payload.

The price-list drawing function is extracted from the preceding `Quotation.jsx` without changing its body apart from indentation. Group headings/order, names/prices, zero-price dash, page-break thresholds, business contact text, footer and `Jan-Jimels-Pricelist.pdf` filename are preserved. A source comparison and renderer-spy regression test verify this. `frontend/src/pdf/quotePdf.js` is untouched; branded quotation and delivery-order PDF payloads/layout code are outside this phase.

Backend files, API client, authentication/JWT handling, authorization guards, admin pages, models/migrations, RLS, rate limits, stock calculations and route definitions are unchanged. The lifecycle remains **Pending → Confirmed → Out for Delivery → Delivered → Completed**, with the baseline delivered/completed/missing-item/custom-item inventory regression cases still applicable.

## Verification and limitations

From `frontend/`:

```sh
node node_modules/oxlint/bin/oxlint src
node node_modules/vite/bin/vite.js build
node node_modules/vitest/vitest.mjs run
```

From `backend/`, using the prepared environment with the repository requirements and configured development settings:

```sh
/workspace/scratch/35615cf40747/baseline-venv/bin/python manage.py check
```

Results: lint passes with existing warnings outside the new quotation components; production build passes with the existing large-chunk warning; Django reports no issues; all **36 tests across four files** pass. New tests cover exact payload assembly, optional event fields, phone-only/email-only validation, first-invalid focus, backward retention, selected quantities and custom drafts, loading/error/retry/empty/filter states, failed-submit retention, duplicate-submit prevention, success, leave confirmation and history navigation, cross-step server errors, price-list defaults at 375/768/1024/1440px, PDF text/group/data calls, and the actual application's public/admin role redirects. Prior shared UI and public-site tests remain passing.

**Visual verification is incomplete.** The managed preview started, but the browser could not open `http://terminal.local:4173/quote` (`net::ERR_BLOCKED_BY_CLIENT`). No screenshots are claimed or committed. Width tests mock `matchMedia`; they verify disclosure behavior, not rendered geometry or absence of horizontal scrolling. JSDOM focus/dialog tests do not prove native top-layer inertness, touch interaction, screen-reader announcements or browser unload prompts. No live customer request was sent. Native unload prompts depend on browser policies/user interaction, and leaving after confirmation discards the in-memory draft; there is no new persistent storage. PDF drawing calls are tested, but a visual export inspection remains outstanding.

### Manual review before merge

1. At **375, 768, 1024 and 1440px**, complete `/quote` using keyboard and touch. Check no document-level horizontal scrolling, visible focus, usable quantities/actions and headings/invalid fields clear of the fixed navbar. At 200% zoom, check labels, errors and long equipment names wrap.
2. Go backward from each step and via completed-step controls. Verify all fields, quantities, custom entries/drafts and filters remain. Toggle the full price list, resize, and check the mobile initial disclosure state.
3. Test phone-only, email-only, neither contact method, malformed email, missing name and invalid quantity. Verify field associations, the first-invalid target, and summary links including errors returned for an earlier step. Use a screen reader to check progress, loading and submission announcements.
4. Simulate catalog delay, failure, retry, empty data and unmatched filters. Confirm custom requests remain possible and the anonymous network response contains no stock fields.
5. In a development environment, simulate submission failure/400/429, then retry; compare the complete JSON object and line formatting above. Verify retained data, one request during progress, success next steps and a warning-free return home after success.
6. With a partial form, follow Home/other navigation and browser Back. Check Keep editing, Leave quotation, Escape, focus trapping/restoration and background interaction prevention. Test reload/close after user interaction for the browser warning.
7. Export a populated price list, including all categories, zero-price items and enough rows for multiple pages. Compare names, prices, headings, contact/footer text and filename with the baseline. Smoke-test the unchanged admin quotation and delivery-order PDFs.
8. Recheck anonymous admin redirects, admin access, super-admin-only Users and the baseline order/inventory lifecycle cases in a development dataset. No phase after Phase 3 is included.
