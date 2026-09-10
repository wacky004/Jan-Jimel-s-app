import { PRICELIST_GROUPS } from './quotationData'

// Existing price-list renderer, extracted without changing its drawing/data format.
export async function downloadPricelist(grouped) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Jan & Jimels Party Needs', 105, 18, { align: 'center' })
  doc.setFontSize(11)
  doc.text('Event Rentals & Supplies - Est. 1995', 105, 25, { align: 'center' })
  doc.text('#1 Pelota St., Saint Francis Village, Cainta, Rizal', 105, 31, { align: 'center' })
  doc.text('0908-950-3879 | 0999-760-3211 | janjimels95@gmail.com', 105, 37, { align: 'center' })

  doc.setFontSize(16)
  doc.text('PRICELIST', 105, 50, { align: 'center' })
  let y = 62
  for (const [cat, title] of PRICELIST_GROUPS) {
    const list = grouped[cat]
    if (!list || list.length === 0) continue
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(13)
    doc.setTextColor(20, 39, 77)
    doc.text(title.toUpperCase(), 14, y)
    doc.setDrawColor(212, 175, 55)
    doc.line(14, y + 2, 196, y + 2)
    y += 10
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    for (const it of list) {
      if (y > 280) {
        doc.addPage()
        y = 20
      }
      const price = Number(it.rental_price) > 0 ? `P${Number(it.rental_price).toLocaleString('en-PH')}` : '—'
      doc.text(it.name, 18, y)
      doc.text(price, 196, y, { align: 'right' })
      y += 6
    }
    y += 6
  }
  y += 4
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('PRICES ARE SUBJECT TO CHANGE WITHOUT PRIOR NOTICE.', 105, y, { align: 'center' })
  doc.text('PLEASE CONTACT US FOR MORE INFORMATION AND BOOKINGS.', 105, y + 5, { align: 'center' })
  doc.save('Jan-Jimels-Pricelist.pdf')
}
