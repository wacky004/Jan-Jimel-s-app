# Phase 2 — Public navigation and landing page

Phase 1 [PR #2](https://github.com/wacky004/Jan-Jimel-s-app/pull/2) was merged with
explicit owner authorization before this work started. Base main commit:
`8be8661845cd19f2a20073450c3f384cc532d9f8`.
Branch: `ui-redesign/phase-2-public-site`.

Use [Phase 0](UI-REDESIGN-BASELINE.md) for business/workflow comparisons and
[Phase 1](UI-DESIGN-SYSTEM.md) for the reusable component contracts.

## Public structure

The landing page now composes focused presentation components in this order:

1. Hero: primary Request a Quote link; secondary call and text links.
2. Service proof: established in 1995, Cainta location, rental categories.
3. Equipment poster and current rental-rate preview.
4. How booking works: share plans, review quotation, confirm details.
5. Services and event types.
6. All 20 real event-gallery photographs.
7. Business history and the original business-banner image.
8. Contact details and the existing OpenStreetMap embed.
9. Final quotation CTA.

Navigation offers Home, Rentals & Rates, Gallery, About, Contact and Request a
Quote. Existing `/#equipment`, `/#gallery`, `/#about`, `/#contact` and `/#services`
anchors remain valid. `/` and `/quote` and every admin route are unchanged.
The footer keeps Admin Login as a small link in its bottom row.

`Landing.jsx` only composes sections. `components/public/` owns the scoped CSS,
section presentations, live rates, gallery data/dialog, shared navigation links,
quotation link and lazy desktop 3D scene. No quotation-form or admin-page
redesign is included.

## Content and photographs

Business name, founding year, address, contacts and rental categories come from
`docs/00-PROJECT-OVERVIEW.md`, README and the existing interface. The postal address
now consistently uses the project overview's New St. Francis Village wording.
The map coordinates and embedded map URL are unchanged.

Removed unverified numeric or absolute claims from rendered copy: “1000+ Items”,
“5000+ Events”, “100% Reliable Delivery”, “500+ monobloc chairs”, any-weather /
any-venue assurances and universal sanitization/delivery guarantees. “Est. 1995”
replaces a hardcoded elapsed-year counter. No testimonials, certifications,
inventory counts or new service promises were invented. Booking instructions
explain that a quotation request does not confirm a booking.

All 20 gallery source paths are preserved in `galleryData.js`. Alt descriptions
were written after visually inspecting each photo; dimensions are read from the
original files. The original logo, equipment poster and business banner remain
present. No image bytes were changed or removed, and no generated stock imagery
was added. Claims printed inside the preserved business artwork are unchanged.
The equipment poster can also be opened at full size, with a new-tab notice.

## Interaction and accessibility

- Fixed navigation has a stable 5rem minimum height. The public layout reserves
  space for it, and section/control scroll margins leave additional clearance.
  Hash navigation works from `/quote`, on direct loads and on repeated/hash
  history navigation. Its destination section receives focus after dialog cleanup
  and route focus. Home returns to the top/main target.
- Mobile navigation uses the Phase 1 modal Drawer: named dialog, `aria-expanded`,
  `aria-controls`, first-link focus, Tab loop, Escape/close handling, native
  background inertness, body scroll lock and focus restoration. Selecting a link
  closes it. Resizing to the desktop breakpoint closes it and focuses the brand;
  returning to mobile does not reopen it. Desktop navigation starts at 1200px
  to keep the full link row from crowding at tablet widths.
- The gallery uses the shared Dialog. It has Close, Previous and Next controls,
  Left/Right arrow navigation with wraparound, descriptive alt text and a polite
  photo-position/caption announcement. Tab remains trapped. Closing restores
  focus to the original thumbnail. The order of thumbnails is unchanged.
- Shared Dialog adds optional `closeLabel` and composes consumer `onKeyDown`
  handlers with its existing Tab trap. Defaults and existing consumers remain
  compatible; native Escape and modal focus behavior are retained.
- All modified public interface icons use Lucide. Existing checkmark characters,
  bounce animation and scale/translation hover effects were removed. New hover
  transitions use the 200ms semantic duration. No page-reveal motion is used.
- Gold-on-light text uses the Phase 1 dark-gold token. Navy surfaces use light-gold
  accents; quotation buttons use deep-navy text on brand gold. Existing fonts and
  focus styles remain in force.

## Hero rendering policy

The desktop scene retains the banquet table, chairs, glassware, balloons, gifts,
lighting and navy/gold identity. Its heavy React Three Fiber/Drei/Three imports
now live in the lazy `HeroScene.jsx` module.

The scene mounts only when **all** conditions are true: at least 1024px, fine
pointer, no reduced-motion preference, hero in view, visible browser tab and
animation not paused. Mobile/coarse-pointer and reduced-motion visitors get an
actual static photograph without a mounted Canvas or continuous animation.
Media-query subscriptions react to viewport and preference changes. Leaving the
viewport, hiding the tab or selecting Pause unmounts the scene; Play resumes it
only when eligible. A real photo is also the lazy-loading/error fallback.

The build emits the scene as its own deferred chunk. It is still a substantial
3D dependency and retains Vite's large-chunk warning; this is not a performance
benchmark or a claim that WebGL has been visually tested here.

## API and regression boundaries

`Rentals.jsx` makes the same `api.get('/items/')` request as the original landing
page. It still accepts `data.results || data`, groups the same five categories
and displays only positive `rental_price` values using the original peso-formatting
expression. Only `id`, `name`, `category` and `rental_price` are consumed. No stock,
notes or private item fields appear even if the response came from a signed-in
session. Retry repeats that same request; there is no polling, new query parameter
or extra API endpoint. Late results after unmount are ignored.

Rates explicitly distinguish loading skeleton, request failure with retry, loaded
but empty rate groups, and loaded rates. Retry moves focus to the rates heading
before replacing the button; loaded/empty results have a short status announcement.
Quotation/contact actions remain usable when rates are unavailable. Prices in
preserved artwork are not used as a fallback for failed live rates.

The final protected-source diff confirms no changes to backend code, database,
API/auth modules, route definitions/guards, quotation form, admin workflows,
PDF generation/payloads, package versions or image assets. The normal order
lifecycle remains Pending → Confirmed → Out for Delivery → Delivered → Completed.
Inventory delivery, return, missing/custom-item behavior, anonymous data limits,
permissions, JWT and rate limits remain untouched.

## Verification — 2026-09-10

| Check | Result |
| --- | --- |
| `node node_modules/oxlint/bin/oxlint src` | Pass, zero errors; 21 existing warnings remain, down from 22 after removing the unused hero material |
| `node node_modules/vite/bin/vite.js build` | Pass; deferred 3D chunk still produces the large-chunk warning |
| Configured backend `python manage.py check` | Pass, no issues, using the task virtual environment with repository requirements |
| `node node_modules/vitest/vitest.mjs run` | 21 passing tests across the Phase 1 and public-site suites |
| Additional lint on tests, `git diff --check` | Pass |
| Protected files / photographs / emoji / hover scan | Pass; protected files unchanged and all existing image paths retained |
| Browser review / screenshots | Blocked: the running preview was rejected with `ERR_BLOCKED_BY_CLIENT`; no browser screenshot or successful visual assertion is claimed |

New tests cover mobile-menu semantics/focus/cancel/resize, cross-page hash focus,
gallery wraparound/arrow controls/focus restoration, rates loading/failure/retry/
empty/loaded states and sensitive-field exclusion, and hero mode changes at
375/768/1024/1440px including motion, pointer, pause, offscreen and tab visibility.

**The four-width automated checks mock media queries. They do not measure layout.**
As documented in Phase 1, JSDOM's layout and native dialog behavior are shimmed;
these tests do not prove actual overflow, WebGL rendering, native Escape dispatch,
background inertness or screen-reader output.

## Manual review before merge

At **375, 768, 1024 and 1440px**:

1. Load `/` and confirm the primary hero CTA is visible in the initial viewport,
   page width fits without horizontal scrolling, images retain useful framing,
   rates wrap without collisions, and navigation never covers section headings.
2. Use Tab/Shift+Tab only: skip link, mobile navigation, hash links, footer links,
   quote CTA and gallery. Test direct `/#equipment`, `/#services`, other anchors,
   `/quote` → landing anchors and Back/Forward navigation.
3. Open the mobile menu: confirm initial focus, background blocking, Escape/Close,
   focus restoration and body scroll lock. Resize through 1200px while open;
   ensure the page unlocks and the hidden menu does not reopen.
4. Open first/last gallery photos. Exercise Previous/Next, both arrow keys, Tab
   wrap and Escape. Check captions/alt text and restoration to the thumbnail with
   a screen reader. Verify every original photograph can be opened.
5. Use development network throttling/offline mode to inspect loading, failure
   and retry. With a safe empty catalog, verify the empty state. Confirm the
   Request a Quote and contact links work in every state, and no stock data leaks.
6. On a fine-pointer desktop, inspect the real 3D scene and Pause/Play. Toggle
   reduced motion while the page is open, resize to mobile, scroll the hero out
   of view and hide the tab. Confirm there is no Canvas/continuous animation in
   fallback mode and no fallback-to-animation flash for reduced-motion visitors.
7. Check 200% zoom, reduced motion, forced colors, visible focus, labels and screen
   reader announcements. Check the unchanged quotation form still clears the fixed
   navbar and preserves its request payload/validation/PDF behavior.
8. Use the Phase 0 regression matrix if testing business workflows. No production
   customer data or credentials should be added to this documentation.

No Phase 3 work or automatic Phase 2 merge is included.
