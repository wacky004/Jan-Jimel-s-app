# UI foundations — Phase 1

Phase 0 was merged in [PR #1](https://github.com/wacky004/Jan-Jimel-s-app/pull/1).
This phase starts at main `40597d81e091ffd2d1f2c38b9674de49b3c01774`.
Compare later changes with [the baseline](UI-REDESIGN-BASELINE.md), including its
route/workflow regression matrix. This document describes the shared foundation;
it is not a claim that every existing page now meets WCAG 2.2 AA.

## Scope and adoption

- Semantic tokens live in `frontend/src/index.css`. The raw Tailwind palette,
  Playfair Display headings and Poppins body font remain available.
- Import components from `frontend/src/components/ui.jsx`. The implementation
  is split into `components/ui/primitives.jsx` and `components/ui/overlays.jsx`.
- Existing `input`, `label`, `btnPrimary`, `btnGold`, `btnGhost`, `formatPHP`,
  `formatDate` and `formatDateTime` exports retain their original definitions.
  Migrate them deliberately in later phases; they do not automatically acquire
  all the new component behavior.
- `StatusBadge` keeps its `status`/`label` contract. Its colors and 12px text now
  use semantic tokens. `out_for_delivery` uses informational navy rather than
  the old purple. No status values or lifecycle transitions changed.
- Login demonstrates `TextField`, `Button` and `FormErrorSummary` without changing
  its submit handler, constraints, autocomplete, redirects or error messages.
- App and AdminLayout add the skip link, focusable main target and route focus.
  Individual page layouts, legacy dialogs, tables, icons and photos are retained.

## Brand and tokens

The **Brand Override** in
[`MASTER.md`](../design-system/jan-jimels-party-needs/MASTER.md) wins over its
generated palette. Do not introduce its purple/orange theme.

All names below have the `--ui-` prefix. Use the semantic role instead of choosing
an arbitrary palette shade. The existing `--font-display` and `--font-body` tokens
remain the font sources.

| Role | Tokens and intended use |
| --- | --- |
| Surfaces | `surface-page` #EEF2F9; `surface-card` and `surface-elevated` white; `surface-muted` #D8E2F1; `surface-inverse` #071126 |
| Text | `text-primary` #14274D; `text-secondary` #475569; `text-inverse` white; `text-inverse-secondary` #D8E2F1; `text-gold` #765B12 |
| Borders | `border` #B3C5E3 for decoration; `border-strong` #5478B8 for controls that need a visible boundary |
| Focus | `focus-ring` navy and `focus-gap` white; 3px outline with a contrasting gap; system Highlight outline in forced colors |
| Actions | `action-{primary,conversion,secondary,ghost,danger}`, with matching `-hover` and `-text` tokens |
| Feedback | `{success,warning,error,info}-{surface,text,border}`; accompany color with words and Lucide icons |
| Radius | `radius-sm` 0.5rem, `radius-md` 0.75rem, `radius-lg` 1.25rem, `radius-pill` 999px |
| Shadows | `shadow-card`, `shadow-elevated`, `shadow-overlay` for increasing elevation |
| Spacing | `space-{1,2,3,4,6,8,12}` = 0.25, 0.5, 0.75, 1, 1.5, 2, 3rem |
| Motion | `duration-fast` 150ms, `duration-normal` 200ms, `duration-slow` 300ms and `ease` ease-out |

Conversion buttons retain gold #D4AF37 and light-gold hover #F0D47A, with deep-navy
text. **Do not use raw brand gold as small text on a light surface.** Use
`text-gold`, an accessible darker gold, on white/soft backgrounds. Light gold is
appropriate on deep navy. Dark gold has 6.41:1 contrast on white and 5.71:1 on
the soft background; deep navy on the conversion button is 8.94:1.
Automated tests check normal-text contrast of at least
4.5:1 for default text, action and feedback pairs; arbitrary consumer overrides
still need checking. Ghost buttons assume a light background. For fields on
navy, use `tone="inverse"`; do not apply inverse tokens to an entire light card.

New controls have minimum 44px action heights. New hover effects change color
and border only. Dialog entry fades in over 200ms. Skeletons are static, and the
existing global reduced-motion rule disables motion; dialogs also explicitly
disable their entry animation. Existing page animations and hover transforms
listed in Phase 0 are deferred to their page phases.

## Component contracts

| Component | Consumer responsibilities and supported options |
| --- | --- |
| `Button` | `variant`, `busy`, `busyLabel`, `disabled`; defaults to `type="button"`. Explicitly set `type="submit"` for forms. Native button props/ref pass through. Busy disables repeat actions. |
| `IconButton` | Supply a meaningful `label` and a Lucide SVG child marked `aria-hidden="true"`. Never rely on the tooltip alone. Native button behavior and busy state are inherited. |
| `TextField`, `SelectField`, `TextareaField` | Required visible `label`; optional stable `id`, `hint`, `error`, `tone="inverse"`, `className` for the wrapper and `controlClassName` for the control. Native props/ref pass through, including `name`, `required`, `maxLength`, autocomplete and input type. Select options are children. |
| `CheckboxField` | `label`, `hint`, `error` and native checkbox props/ref; the whole label is clickable. Use `checked`/`onChange` for controlled fields. |
| `FieldError` | `id` and message children for custom controls. Link the control through `aria-describedby` and mark `aria-invalid`. Standard fields do this automatically. |
| `FormErrorSummary` | `errors` array of `{fieldId?, message}`, optional `id`, `title`, `focus`. Focus moves to the summary when errors first appear with `focus`. Field links focus and scroll the matching control into view. Omit `fieldId` for form-level errors. |
| `InlineAlert` | `tone="success|warning|error|info"`, `title`, children and optional action. Error announcements use `alert`, others `status`; use `announce={false}` for static examples or feedback inside another live region. |
| `StatusBadge` | Existing backend `status` and optional display `label`. Unknown values use neutral styling. A badge is informational, never a transition control. |
| `LoadingSkeleton` | `label`, `lines`, optional `className`; exposes one loading status and hides decorative bars. Replace when loading completes. |
| `EmptyState` | `title`, description children, optional action and Lucide `icon`. Use different copy/actions for an empty collection and zero filter matches. |
| `ErrorState` | `title`, description children, `onRetry`, `retrying`. Parent owns the request and retains filters/form data. |
| `ToastRegion` | Mount once, keep mounted, pass `toasts` with stable `id`, `title`, `message`, optional `tone`, and `onDismiss(id)`. Polite additions announce messages. No automatic timeout or business state is built in. Keep the queue short and put critical errors next to their source. |
| `Dialog` | Controlled `open`, `onClose`, required `title`, optional `description`, children, footer, `initialFocusRef`, `dismissible` and opt-in `closeOnBackdrop`. |
| `ConfirmationDialog` | Dialog contract plus `onConfirm`, `confirmLabel`, `cancelLabel`, `busy`, `variant`. Cancel receives initial focus. While busy, confirmation/cancel/close/Escape dismissal are blocked. Parent closes after its operation succeeds and shows errors on failure. |
| `Drawer` | Same lifecycle/props as Dialog, with `side="right|left"`. A viewport-constrained sheet foundation, not a replacement for existing navigation yet. |

Use **Lucide React** (`lucide-react`) for new interface icons; use named imports,
20–24px size and consistent strokes. Do not add emoji/text symbols as icons.
Existing icons will migrate with their owning pages, not in a global replacement.

### Form example

```jsx
import { Button, TextField, FormErrorSummary } from '../components/ui'

<form onSubmit={existingSubmitHandler}>
  <FormErrorSummary errors={errors} focus />
  <TextField
    id="customer-name"
    name="customer_name"
    label="Customer name"
    required
    maxLength={existingLimit}
    value={customerName}
    onChange={(event) => setCustomerName(event.target.value)}
    hint="Enter the customer's full name."
    error={nameError}
  />
  <Button type="submit" variant="conversion" busy={saving} busyLabel="Saving…">
    Save
  </Button>
</form>
```

The components do not validate business rules, sanitize payloads, fetch data or
change field names. Retain existing handlers and native constraints. Clear a
previous submit-error summary when starting a retry so a new failure can receive
focus. Avoid announcing every keystroke as an error.

### Modal behavior and example

`Dialog` uses native `HTMLDialogElement.showModal()` and portals to the body.
The browser top layer makes content outside the modal inert, including navigation,
and blocks background pointer/keyboard interaction. Body scrolling is locked;
nested dialogs keep the lock until the final modal closes.

- Accessible title/description are wired with generated IDs, `role="dialog"`
  and `aria-modal="true"`.
- Focus starts at `initialFocusRef` when available, otherwise the first enabled
  control, otherwise the dialog. For long content, explicitly focus a short
  introductory element with `tabIndex={-1}`.
- Tab and Shift+Tab wrap inside. Native Escape cancellation calls `onClose`.
  Close and backdrop dismissal use the same controlled callback.
- Cleanup closes the native dialog, releases its scroll lock and restores the
  originating focus when that element still exists. If the trigger is removed
  by a successful operation, the consumer must focus the next logical location.
- Use React state to close. Do not use `<form method="dialog">`, set the native
  `open` attribute yourself, or call `.close()` on the element externally.
- Modal background inertness requires native dialog support in current evergreen
  browsers. There is no legacy-browser polyfill in this phase.

```jsx
const [open, setOpen] = useState(false)
const nameRef = useRef(null)

<Button onClick={() => setOpen(true)}>Edit details</Button>
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Edit details"
  description="Review the details before saving."
  initialFocusRef={nameRef}
  footer={<Button onClick={() => setOpen(false)}>Done</Button>}
>
  <TextField ref={nameRef} label="Name" />
</Dialog>
```

Keep primary feedback inside an open modal: a global toast behind the native top
layer is not an actionable error surface. Preserve destructive-action confirmation
and existing permission checks when adopting ConfirmationDialog.

## Navigation foundation

The first global link is “Skip to main content”. It becomes visible on focus and
focuses `#main-content`, whose `tabIndex={-1}` permits programmatic focus without
adding a redundant Tab stop. Public pages/login have an App wrapper; authenticated
pages use AdminLayout's existing main. Existing content top padding is retained;
the target/control scroll margin reserves 6rem for fixed navigation.

`RouteFocus` responds to pathname changes, including auth redirects. It waits for
visible main content after guards/lazy chunks resolve. Query-only filters and
hash anchors do not steal focus. Route paths, permissions, protected-route logic
and redirects are unchanged.

## Runnable examples and checks

From `frontend`, install with the existing lockfile (`npm ci`). This phase was
tested with Node 24.19.0; the new JSDOM test dependency requires Node 22.13+ or 24+.
Continue using direct Node commands because the repository documents npm-script
issues on Windows paths containing an apostrophe.

```sh
node node_modules/vite/bin/vite.js
# Open /examples/ui-foundations.html on the development server.

node node_modules/vitest/vitest.mjs run
node node_modules/oxlint/bin/oxlint src
node node_modules/vite/bin/vite.js build
```

The separate `frontend/examples/ui-foundations.html` entry exercises all primitives,
validation, loading, empty/filtered-empty, retry, success, persistent/dismissible
toasts, nested confirmation and a drawer with fictional local state. It makes no
business API calls, is not imported into App and is not a production route/build
entry. Example CSS only loads with that development entry.

### Phase 1 verification record — 2026-09-10

| Check | Result |
| --- | --- |
| Vitest | 10 passing tests: native fields/labels/errors/refs, keyboard actions, busy duplicate prevention, summary links, toast dismissal, dialog/nested focus lifecycle, busy confirmation, drawer, delayed route focus/query preservation, token text contrast/motion bounds |
| Required oxlint on `src` | Pass, zero errors; 22 existing warnings remain (including compatibility-barrel fast-refresh warnings) |
| Vite production build | Pass; existing large-chunk warning remains |
| Backend `python manage.py check` | Pass using the repository requirements in the configured task virtual environment |
| Dependency lock review | Existing package versions unchanged; Lucide and test tooling added with lockfile updates |
| Protected-source diff | No backend, API/auth, route definitions, business workflow handlers, PDF generator/contracts or image changes |
| Browser review | Blocked: the browser rejected the development preview with `ERR_BLOCKED_BY_CLIENT` despite the preview server running. No screenshots or successful browser assertions are claimed. |

JSDOM does not implement real layout, the native modal top layer or native Escape
dispatch. The tests explicitly shim those gaps to test React behavior; they do
**not** prove browser inertness, responsive layout, screen-reader announcements
or complete WCAG conformance.

### Manual review still required before merge

| Viewport | Review target | Status in this environment |
| --- | --- | --- |
| 375px | Catalog wraps to one column, fields/actions fit, dialog/drawer contents scroll within viewport, no document horizontal overflow | Blocked |
| 768px | Two-column examples, action wrapping, dialog sizing, login and public/admin navigation focus | Blocked |
| 1024px | Catalog, login and admin main focus outline/offset; no clipped labels/actions | Blocked |
| 1440px | Catalog width cap, dialogs, drawer alignment, focus/feedback readability | Blocked |

1. At all four widths, inspect the example page and the existing routes `/`,
   `/quote`, `/admin/login`, `/admin`, `/admin/orders`, `/admin/inventory`,
   `/admin/map`, `/admin/quotations`, `/admin/users` using appropriate existing
   reviewer accounts. Compare with Phase 0; do not treat unchanged legacy
   accessibility findings as resolved.
2. Use only the keyboard: reach/activate the skip link, navigate between routes,
   confirm main focus, and verify filtering/hash links retain their intended focus.
3. Validate the blank example form, follow its error link, correct it and submit.
   Check labels, descriptions, success announcement and toast dismissal with a
   screen reader. Check disabled/busy actions do not repeat submissions.
4. Open each overlay. Verify initial focus, Tab/Shift+Tab wrapping, background
   links/inputs cannot be clicked or focused, Escape/close and trigger restoration.
   Open nested confirmation and confirm that closing it restores parent focus and
   keeps the background locked. Check long modal content and browser zoom to 200%.
5. Enable reduced motion and forced colors; verify readable controls, visible
   focus and no dialog entry animation. Check light/dark focus rings visually.
6. On login, check native required validation, invalid credentials, rate-limit
   feedback, successful login and the preserved requested-route redirect with
   authorized test accounts. Never commit credentials or real customer data.
7. Run the Phase 0 critical workflow matrix in a safe development database when
   reviewing later page migrations: normal order lifecycle, inventory delivery/
   return/missing/custom-item cases, anonymous item restrictions, role restrictions,
   quotation payloads and both PDFs. This phase does not alter those workflows.

Phase 1 stops at shared foundations. No subsequent page-redesign phase is included.
