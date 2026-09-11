import { formatDate, formatPHP } from '../lib/format'
import { SHOP } from '../lib/quotePdf'

// Inline hex styles on purpose: html2canvas (image export) cannot parse
// Tailwind v4 oklch()/color-mix() values.

const C = {
  navy: '#14274d',
  navyDeep: '#071126',
  gold: '#d4af37',
  goldLight: '#f0d47a',
  goldPale: '#fdf6dd',
  gray: '#5b6a80',
  light: '#f1f5f9',
  line: '#d8e2f1',
}

const label = { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: C.gold, margin: 0 }
const value = { fontSize: 12, fontWeight: 600, color: C.navy, margin: '2px 0 0' }

export default function QuotePreview({ quote }) {
  const subtotal = quote.lines.reduce((s, it) => s + Number(it.qty) * Number(it.unitPrice), 0)
  const discount = Number(quote.discount || 0)
  const deliveryFee = Number(quote.deliveryFee || 0)
  const setupFee = Number(quote.setupFee || 0)
  const total = Math.max(subtotal - discount + deliveryFee + setupFee, 0)

  return (
    <div id="quote-preview" style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 24px rgba(7,17,38,0.15)' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, background: C.navy, padding: '16px 16px', color: '#ffffff' }}>
        <img
          src="/images/logo.jpg"
          alt="logo"
          style={{ width: 64, height: 64, borderRadius: 12, border: `2px solid ${C.gold}`, objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>JAN &amp; JIMELS</p>
          <p style={{ margin: '2px 0 0', fontSize: 9, letterSpacing: 2, color: C.goldLight, textTransform: 'uppercase' }}>
            Event Rentals &amp; Supplies
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 10, lineHeight: 1.45, color: '#e8eefb' }}>
            {SHOP.address}
            <br />
            {SHOP.tel}
            <br />
            {SHOP.email}
          </p>
        </div>
      </div>
      <div style={{ height: 4, background: C.gold }} />

      <div style={{ padding: '16px 16px' }}>
        <p style={{ margin: 0, textAlign: 'center', fontSize: 17, fontWeight: 700, letterSpacing: 1, color: C.navy }}>
          QUOTATION
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: C.gray }}>Date: {formatDate(quote.dateISO)}</p>

        <div style={{ marginTop: 10, borderLeft: `4px solid ${C.gold}`, paddingLeft: 10 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy }}>{quote.customerName || 'Customer'}</p>
          {quote.phone && <p style={{ margin: '2px 0 0', fontSize: 11, color: C.gray }}>{quote.phone}</p>}
        </div>

        <p style={{ margin: '10px 0 0', fontSize: 11, lineHeight: 1.5, color: C.navy }}>
          Dear {String(quote.customerName || 'Customer').split(' ')[0]}: We are pleased to submit to you our proposal
          with details as follows:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          {[
            ['DATE OF EVENT', quote.eventDate ? formatDate(quote.eventDate) : '-'],
            ['TYPE OF ORDER', quote.eventType || '-'],
            ['VENUE', quote.venue || '-'],
            ['PREPARED BY', 'Jan & Jimels Party Needs'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: C.light, borderRadius: 8, padding: '8px 10px' }}>
              <p style={label}>{k}</p>
              <p style={value}>{v}</p>
            </div>
          ))}
        </div>

        <table style={{ width: '100%', marginTop: 14, borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: C.navy, color: '#ffffff' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>ITEM</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>QTY</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>PRICE</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((it, i) => (
              <tr key={it.id || i} style={{ background: i % 2 === 0 ? C.light : '#ffffff' }}>
                <td style={{ padding: '6px 8px', fontWeight: 500, color: C.navy }}>
                  {it.name}
                  {it.type === 'package' ? ' (Package)' : ''}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: C.navy }}>{it.qty}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: C.navy }}>{formatPHP(it.unitPrice)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: C.navy }}>
                  {formatPHP(Number(it.qty) * Number(it.unitPrice))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 12, borderTop: `2px solid ${C.gold}`, paddingTop: 8, textAlign: 'right', fontSize: 11 }}>
          {(discount > 0 || deliveryFee > 0 || setupFee > 0) && (
            <>
              <p style={{ margin: '2px 0', color: C.gray }}>
                Subtotal: <span style={{ fontWeight: 600, color: C.navy }}>{formatPHP(subtotal)}</span>
              </p>
              {discount > 0 && (
                <p style={{ margin: '2px 0', color: C.gray }}>
                  Discount: <span style={{ fontWeight: 600, color: C.navy }}>- {formatPHP(discount)}</span>
                </p>
              )}
              {deliveryFee > 0 && (
                <p style={{ margin: '2px 0', color: C.gray }}>
                  Delivery Fee: <span style={{ fontWeight: 600, color: C.navy }}>+ {formatPHP(deliveryFee)}</span>
                </p>
              )}
              {setupFee > 0 && (
                <p style={{ margin: '2px 0', color: C.gray }}>
                  Setup Fee: <span style={{ fontWeight: 600, color: C.navy }}>+ {formatPHP(setupFee)}</span>
                </p>
              )}
            </>
          )}
          <p style={{ margin: '6px 0 0', background: C.goldPale, borderRadius: 8, padding: '8px 12px', fontSize: 15, fontWeight: 700, color: C.navy }}>
            TOTAL: {formatPHP(total)}
          </p>
        </div>

        {quote.notes && (
          <p style={{ margin: '12px 0 0', fontSize: 10, lineHeight: 1.5, color: C.gray }}>
            <span style={{ fontWeight: 700, color: C.navy }}>Notes: </span>
            {quote.notes}
          </p>
        )}

        <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 10, fontSize: 10, lineHeight: 1.55, color: C.gray }}>
          <p style={{ margin: 0, fontWeight: 700, color: C.navy }}>MODE OF PAYMENT</p>
          <p style={{ margin: '2px 0 0' }}>{SHOP.paymentMode}</p>
          <p style={{ margin: '8px 0 0', fontWeight: 700, color: C.navy }}>TERMS AND CONDITIONS</p>
          {SHOP.terms.map((t) => (
            <p key={t} style={{ margin: '2px 0 0' }}>
              - {t}
            </p>
          ))}
          <p style={{ margin: '10px 0 0' }}>Thank you for your time and for considering our proposal.</p>
          <p style={{ margin: '8px 0 0' }}>Sincerely yours,</p>
          <p style={{ margin: '2px 0 0', fontWeight: 700, color: C.navy }}>{SHOP.signature}</p>
          <p style={{ margin: 0 }}>{SHOP.title}</p>
        </div>
      </div>

      <div style={{ background: C.navyDeep, padding: '8px 16px', textAlign: 'center', fontSize: 9, color: C.goldLight }}>
        Est. 1995 | {SHOP.tel} | {SHOP.email}
      </div>
    </div>
  )
}
