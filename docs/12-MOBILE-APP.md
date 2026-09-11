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
- **Party needs → individual, step by step:** pick a **category card** (Chairs,
  Tables, Linen & Décor, Tent…) showing selected counts, then adjust quantities
  on that category's item screen with − qty + (quantity is also **typeable**).
- **Price fields** start empty (no leading-zero typing) and **select-all on focus**;
  "Price for this quote" appears once an item/package is added and only affects
  the current quotation.
- Optional **Discount**, **Delivery Fee**, and **Setup Fee** (blank = free, e.g.
  nearby locations). Totals: `Subtotal − Discount + Delivery + Setup`.
- Currency shown as **PHP 1,234.00** everywhere (app, PDF, image).

## Saving & sharing

- **Share PDF / Share Image** → Android share sheet (Messenger, WhatsApp, email…)
- **Save PDF / Save Image** → saves to the phone: tries the **Downloads** folder
  first (`Download/`), falls back to **Documents**, and if the OS blocks both,
  the app tells you where it went or use Share. A confirmation shows the exact
  file name and location.
- **Image export is A4-width (794px @2x)** — document-shaped like the PDF, not a
  narrow vertical strip.
- **PDF filename:** `Quotation-{CustomerName}-{date}.pdf`

## Back gesture / exit behaviour (Android)

- Back gesture or ← during **New Quotation with any data** → confirmation
  *"Cancel this quotation? Your changes will not be saved."* (Keep Editing / Cancel Quotation)
- Back on other screens → returns to Home
- Back on Home → *"Exit JJ Quotation?"* confirmation (never exits silently)
- Implemented via `@capacitor/app` `backButton` + `src/lib/backButton.js` registry

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

> **Troubleshooting:** if the run fails within seconds with no steps executed and
> the annotation *"The job was not started because your account is locked due to
> a billing issue"*, fix the payment issue under GitHub **Settings → Billing and
> plans** (public repos need a healthy billing account to run Actions). No code
> change is needed — just re-run the workflow afterwards. Alternative: build
> locally with Android Studio (below).

### Local build (verified on this PC — no Android Studio GUI needed)

Requirements already present on the dev PC: Android Studio (for its bundled JDK 21),
Android SDK with platform android-35 + build-tools 35.0.0, accepted SDK licenses.

Because the project path contains an apostrophe (`Jan & Jimel's ...`), `gradlew.bat`
fails — run the Gradle wrapper **directly through Java** instead:

```powershell
cd mobile
node node_modules\vite\bin\vite.js build
node node_modules\@capacitor\cli\bin\capacitor sync android

cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
& "$env:JAVA_HOME\bin\java.exe" -classpath "gradle\wrapper\gradle-wrapper.jar" `
    org.gradle.wrapper.GradleWrapperMain assembleDebug --no-daemon
```

Output: `mobile\android\app\build\outputs\apk\debug\app-debug.apk` (~4.4 MB).
First build downloads Gradle 8.11.1 + dependencies (~5 min); later builds ~1 min.
Copy the APK to the phone and install (allow "unknown apps" once).

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
