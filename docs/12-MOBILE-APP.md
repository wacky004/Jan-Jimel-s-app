# 12 — Quotation Mobile App (Android, offline)

An offline-first Android app for creating customer quotations fast (e.g. when
customers inquire through Facebook). Built for non-technical users — large
buttons, big text, minimal typing. Full English.

**Location:** `mobile/` (same repo). App name: **JJ Quotation**
(`ph.janjimels.quotation`).

## Tech stack

| Concern | Choice |
|---|---|
| Shell | Capacitor 7 (`@capacitor/android`) — bundles the web app, works offline |
| UI | React 19 + Vite 8 + Tailwind 4 (brand navy/gold, big-touch sizes) |
| Local data | IndexedDB via `localforage` (`mobile/src/lib/storage.js`) |
| PDF | `jsPDF` — reuses the website's branded quotation layout (`mobile/src/lib/quotePdf.js`) |
| Image export | `html2canvas` of `QuotePreview` (inline hex styles — html2canvas cannot parse Tailwind v4 `oklch`) |
| Sharing | `@capacitor/filesystem` + `@capacitor/share` → Android share sheet (Messenger/WhatsApp/email); browser fallback downloads the file |
| APK build | GitHub Actions (`.github/workflows/android-apk.yml`) — no Android Studio needed locally |

## Screens

| Route | Screen |
|---|---|
| `/` | Home — 5 big buttons (New Quotation, Saved, Packages, Items & Prices, Settings) |
| `/quote` | **4-step wizard**: 1 Customer → 2 Items (Equipment packages / Party Needs) → 3 Review & pricing → 4 Generate |
| `/packages` | Package list + builder (pick items, set ONE package price) |
| `/catalog` | Items & Prices — Party Needs (individual prices) and Equipment (package items) |
| `/quotes` | Saved quotations — re-share PDF/image, delete |
| `/settings` | Backup (JSON file), Restore, Reset |

## Pricing model

- **Equipment → packages:** pick items, set one bundle price. Saved for reuse.
- **Party needs → individual:** qty × unit price with steppers.
- Any line's price can be adjusted during Review (special customer pricing).
- Optional discount; total auto-computed.

## PDF rules

- Same branded document as the website: letterhead, event boxes, item table,
  payment mode, terms, signature (see `docs/06-PDF-GENERATION.md`).
- **Filename:** `Quotation-{CustomerName}-{YYYY-MM-DD}.pdf` (spaces → dashes).
- Image export produces `Quotation-{CustomerName}-{date}.png`.

## Offline behaviour

- Everything runs on-device; no internet required.
- Catalog seeds from **Pricelist 3** on first launch; editable in Items & Prices.
- Customers are remembered for one-tap reuse; quotations are saved when shared.
- **Backup/Restore** (Settings) exports/imports a JSON file — do this regularly
  since data lives only on the phone.

## Building the APK (GitHub Actions — recommended)

1. Push changes touching `mobile/**` to `main` (or run the workflow manually).
2. GitHub → **Actions → Build Android APK** → open the run → download the
   **JJ-Quotation-APK** artifact.
3. On the phone: allow "Install unknown apps" for the file manager/browser, then
   open `app-debug.apk` to install. Updating = install the new APK over the old
   one (data is preserved).

### Local build (optional, needs Android Studio + JDK 21)

```powershell
cd mobile
node node_modules\vite\bin\vite.js build
node node_modules\@capacitor\cli\bin\capacitor sync android
cd android
.\gradlew assembleDebug   # output: app\build\outputs\apk\debug\app-debug.apk
```

## Development (browser)

```powershell
cd mobile
node node_modules\vite\bin\vite.js --port 5176
```

Browser fallbacks: Share → downloads the file instead of opening the share
sheet. All other flows work identically.

## Sync (future)

Phase 2 (not built): when online, push quotations to the website's Quotations
tab and pull price updates from `/api/items/`.
