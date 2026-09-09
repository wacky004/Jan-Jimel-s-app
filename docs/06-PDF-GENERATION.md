# 06 — PDF Generation

Client-side jsPDF module: `frontend/src/pdf/quotePdf.js`
(lazy-imported, so jsPDF stays out of the main bundle).

## Exports

```js
downloadQuotationPdf(quotation)  // branded QUOTATION
downloadOrderPdf(order)          // branded DELIVERY ORDER
```

## Data contracts

**Quotation**

```js
{ id: number|null, date: 'September 8, 2026', name, phone, email,
  address: venue, event_type, event_date, venue,
  items: [{ description, quantity, unit_price, price_na }] }
```

**Order**

```js
{ id, date, customer_name, contact_number, email,
  event_type, event_date, event_time, delivery_address, status,
  items: [{ item_name, quantity, unit_price, notes }],
  total_price, discount, deposit, balance }
```

## Layout (A4, mm)

- **Header band (0–46):** navy fill, gold rule at y=46. Two zones split by a
  **gold vertical divider at x=108**:
  - Left: framed logo (rounded rect 10,9,28.5×28.5 + logo.jpg) + name "JAN & JIMELS"
    (16pt) + two short lines "EVENT RENTALS & SUPPLIES" / "EST. 1995 | CAINTA, RIZAL"
  - Right (x=116–198): address (max 2 wrapped lines), Tel, email — all
    `splitTextToSize`-capped
  - **Invariant:** nothing may cross the divider; all right-zone text must fit
    within 198−116 mm (see the past overlap bug notes below)
- **Body (y=57):** centered title QUOTATION/DELIVERY ORDER, ref line
  (`QUOTATION NO.: JJ-0001` — omitted when `id == null`, no more "DRAFT"),
  date, customer block with gold accent bar, salutation
- **Event info:** 2×2 light boxes — DATE OF EVENT / TIME OF DELIVERY (Setup) /
  TYPE OF ORDER / VENUE (orders: DELIVER TO + EVENT TIME)
- **Items table:** navy header row, zebra rows, columns at x 12/128/155/198;
  `price_na` lines print **N/A** for unit price and amount and are excluded
  from the total; page-break aware (rows > y246 → new page + header row)
- **Totals:** gold rules; quotation → TOTAL (or **N/A** when nothing is priced);
  order → TOTAL / DISCOUNT / DEPOSIT / **BALANCE** (gold-filled)
- **Blocks:** MODE OF PAYMENT (50% Down; full upon delivery) · TERMS AND CONDITIONS
  (inspection, damage/loss fees, prices subject to change) · thank-you ·
  **signature "JENNIFER SAN JUAN"**
- **Footer strip** on every page (navy, Est. 1995 | contacts)

## Letterhead constants

`SHOP` in quotePdf.js: name/tagline, address "No. 01 Pelota Street, New St.
Francis Village, San Juan, Cainta, Rizal", Tel 0908-950-3879 | 0999-760-3211,
email janjimels95@gmail.com, signature/title. Update here to change letterheads.

## Logo

`loadLogo()` fetches `/images/logo.jpg` → FileReader dataURL (cached). If it
fails, the text header still renders.

## Known pitfalls (regressions fixed)

1. **Header overlap** — the old long tagline crossed the x=108 divider and the
   Tel row. Fix: short left-zone lines + width-capped right zone. Keep it that way.
2. **"DRAFT"** — unsaved quotes previously printed `JJ-DRAFT`; now the ref line is
   omitted until the quotation has an id.
3. Money renders as `P 1,234.00` (helvetica has no ₱ glyph).

## Regenerating to verify

Open Admin → Quotations → Download PDF (also New Quotation → download before
saving = no ref line), and Orders → detail → Print PDF. Compare against
`images/sample quotation.pdf` structure.
