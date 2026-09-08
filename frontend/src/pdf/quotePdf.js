const BRAND = {
  navy: [20, 39, 77],
  navyDeep: [7, 17, 38],
  gold: [212, 175, 55],
  goldLight: [240, 212, 122],
  white: [255, 255, 255],
  gray: [110, 122, 140],
  light: [241, 245, 249],
  blue: [37, 99, 235],
}

const SHOP = {
  name: 'JAN & JIMELS PARTY NEEDS',
  tagline: 'Event Rentals & Supplies | Est. 1995',
  address: 'No. 01 Pelota Street, New St. Francis Village, San Juan, Cainta, Rizal',
  tel: 'Tel. No.: 0908-950-3879 | 0999-760-3211',
  email: 'janjimels95@gmail.com',
  signature: 'JENNIFER SAN JUAN',
  title: 'Proprietor, Jan & Jimels Party Needs',
}

const TERMS = [
  'Items will be inspected before and after the rental.',
  'Customers may be charged additional fees if there is damage or loss of items.',
  'Prices are subject to change without prior notice.',
]

const PAYMENT_MODE = '50% Down Payment; Full Payment upon delivery.'

let logoData = null

async function loadLogo() {
  if (logoData) return logoData
  const res = await fetch('/images/logo.jpg')
  const blob = await res.blob()
  logoData = await new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
  return logoData
}

function money(n) {
  return `P ${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function drawFooter(doc) {
  const h = doc.internal.pageSize.getHeight()
  doc.setFillColor(...BRAND.navyDeep)
  doc.rect(0, h - 10, 210, 10, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...BRAND.goldLight)
  doc.text(`Est. 1995  |  ${SHOP.tel}  |  ${SHOP.email}`, 105, h - 4, { align: 'center' })
}

async function drawHeader(doc) {
  const logo = await loadLogo()
  doc.setFillColor(...BRAND.navy)
  doc.rect(0, 0, 210, 46, 'F')
  doc.setFillColor(...BRAND.gold)
  doc.rect(0, 46, 210, 1.2, 'F')

  // framed logo badge
  doc.setFillColor(...BRAND.white)
  doc.setDrawColor(...BRAND.gold)
  doc.setLineWidth(0.8)
  doc.roundedRect(10, 9, 28.5, 28.5, 2, 2, 'FD')
  try {
    doc.addImage(logo, 'JPEG', 11.5, 10.5, 25.5, 25.5)
  } catch {
    /* logo failed to load — text header still stands */
  }

  // vertical divider between zones
  doc.setDrawColor(...BRAND.gold)
  doc.setLineWidth(0.5)
  doc.line(108, 10, 108, 38)

  // left zone: name + tagline (width capped well before the divider)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...BRAND.white)
  doc.text('JAN & JIMELS', 45, 20)
  doc.setFontSize(8.5)
  doc.setTextColor(...BRAND.goldLight)
  doc.text('PARTY NEEDS | Event Rentals & Supplies | Est. 1995', 45, 26.5)

  // right zone: contact block, width-limited so it can never cross the divider
  const zoneX = 116
  const zoneW = 198 - zoneX
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.8)
  doc.setTextColor(...BRAND.white)
  const addrLines = doc.splitTextToSize(SHOP.address, zoneW)
  doc.text(addrLines.slice(0, 2), 198, 15, { align: 'right' })
  doc.text(SHOP.tel, 198, 25.5, { align: 'right' })
  doc.text(SHOP.email, 198, 30.5, { align: 'right' })
}

function drawTable(doc, items, startY, totals) {
  const colItem = 12
  const colQty = 128
  const colUnit = 155
  const colAmt = 198
  let y = startY

  const headerRow = () => {
    doc.setFillColor(...BRAND.navy)
    doc.rect(12, y, 186, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...BRAND.white)
    doc.text('ITEM', colItem + 3, y + 5.5)
    doc.text('QTY', colQty, y + 5.5, { align: 'right' })
    doc.text('UNIT PRICE', colUnit, y + 5.5, { align: 'right' })
    doc.text('AMOUNT', colAmt, y + 5.5, { align: 'right' })
    y += 8
  }

  headerRow()

  items.forEach((it, i) => {
    const desc = it.description || it.item_name || 'Item'
    const qty = Number(it.quantity || 0)
    const unit = Number(it.unit_price || 0)
    const isNA = Boolean(it.price_na)
    if (y > 246) {
      drawFooter(doc)
      doc.addPage()
      y = 14
      headerRow()
    }
    if (i % 2 === 0) {
      doc.setFillColor(...BRAND.light)
      doc.rect(12, y - 4.6, 186, 9.6, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...BRAND.navy)
    const lines = doc.splitTextToSize(desc, 105)
    doc.text(lines, colItem + 3, y)
    doc.text(String(qty), colQty, y, { align: 'right' })
    doc.text(isNA ? 'N/A' : money(unit), colUnit, y, { align: 'right' })
    doc.text(isNA ? 'N/A' : money(qty * unit), colAmt, y, { align: 'right' })
    y += Math.max(lines.length, 1) * 4.6 + 4
  })

  // totals block
  const labelX = colUnit
  const amtX = colAmt
  const addTotalRow = (label, value, bold = false, fill = null) => {
    if (y > 258) {
      drawFooter(doc)
      doc.addPage()
      y = 14
    }
    if (fill) {
      doc.setFillColor(...fill)
      doc.rect(12, y - 4.2, 186, 8.4, 'F')
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 10 : 9)
    doc.setTextColor(...BRAND.navy)
    doc.text(label, labelX, y, { align: 'right' })
    doc.text(value, amtX, y, { align: 'right' })
    y += 9
  }

  if (totals && totals.length > 0) {
    doc.setDrawColor(...BRAND.gold)
    doc.line(12, y - 1, 198, y - 1)
    y += 3
    totals.forEach((t) => addTotalRow(t.label, t.value, t.bold, t.fill))
    doc.setDrawColor(...BRAND.gold)
    doc.line(12, y - 1, 198, y - 1)
  } else {
    doc.setDrawColor(...BRAND.gold)
    doc.line(12, y, 198, y)
    y += 2
    addTotalRow('TOTAL', money(items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0)), true, BRAND.goldLight)
  }
  return y
}

function drawBlocks(doc, y, quotation = true) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...BRAND.navy)
  doc.text('MODE OF PAYMENT', 12, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND.gray)
  doc.text(PAYMENT_MODE, 12, y + 11)
  y += 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...BRAND.navy)
  doc.text('TERMS AND CONDITIONS', 12, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.8)
  doc.setTextColor(...BRAND.gray)
  TERMS.forEach((t, i) => {
    doc.text(`•  ${t}`, 12, y + 11 + i * 5)
  })
  y += 11 + TERMS.length * 5 + 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.2)
  doc.setTextColor(...BRAND.navy)
  doc.text(quotation ? 'Thank you for your time and for considering our proposal.' : 'Thank you for choosing Jan & Jimels Party Needs!', 12, y)
  y += 10

  doc.text('Sincerely yours,', 12, y)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...BRAND.navy)
  doc.text(SHOP.signature, 12, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.2)
  doc.setTextColor(...BRAND.gray)
  doc.text(SHOP.title, 12, y)
  return y
}

async function buildPdf(kind, data) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  await drawHeader(doc)
  drawFooter(doc)

  let y = 57
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...BRAND.navy)
  doc.text(kind === 'quotation' ? 'QUOTATION' : 'DELIVERY ORDER', 105, y, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND.gold)
  const ref = kind === 'quotation' ? `QUOTATION NO.: JJ-${String(data.id).padStart(4, '0')}` : `ORDER NO.: ${String(data.id).padStart(4, '0')}`
  doc.text(ref, 198, y, { align: 'right' })
  y += 5.5
  doc.setFontSize(8.5)
  doc.setTextColor(...BRAND.gray)
  doc.text(`Date: ${data.date}`, 12, y)

  y += 9
  doc.setFillColor(...BRAND.gold)
  doc.rect(12, y - 4.4, 1.6, 6.4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...BRAND.navy)
  doc.text(kind === 'quotation' ? data.name : data.customer_name, 17, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.6)
  doc.setTextColor(...BRAND.gray)
  const contactLine = [data.phone || data.contact_number, data.email].filter(Boolean).join('  |  ')
  doc.text(contactLine || '', 17, y + 5)
  doc.text(data.address || data.venue || data.delivery_address || '', 17, y + 9.8)
  y += 16

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.3)
  doc.setTextColor(...BRAND.navy)
  const salutation = kind === 'quotation'
    ? `Dear ${firstOf(data.name)}: We are pleased to submit to you our proposal with details as follows:`
    : `Dear ${firstOf(data.customer_name)}: Please see the delivery details below.`
  doc.text(salutation, 12, y)
  y += 8

  // event info boxes
  const boxW = 88
  const boxH = 20
  const boxY = y
  const info = kind === 'quotation'
    ? [
        ['DATE OF EVENT', data.event_date || '—'],
        ['TIME OF DELIVERY', 'On the event date (Setup)'],
        ['TYPE OF ORDER', data.event_type || '—'],
        ['VENUE', data.venue || '—'],
      ]
    : [
        ['DATE OF EVENT', data.event_date || '—'],
        ['EVENT TIME', data.event_time || '—'],
        ['TYPE OF ORDER', data.event_type || '—'],
        ['DELIVER TO', data.delivery_address || '—'],
      ]
  info.forEach(([label, value], i) => {
    const bx = i % 2 === 0 ? 12 : 12 + boxW + 10
    const by = boxY + Math.floor(i / 2) * (boxH + 4)
    doc.setFillColor(...BRAND.light)
    doc.roundedRect(bx, by, boxW, boxH, 1.5, 1.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.4)
    doc.setTextColor(...BRAND.gold)
    doc.text(label, bx + 4, by + 5.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...BRAND.navy)
    const vlines = doc.splitTextToSize(value || '—', boxW - 8)
    doc.text(vlines, bx + 4, by + 11)
  })
  y = boxY + boxH * 2 + 4 + 8

  const priced = (data.items || []).filter((it) => !it.price_na)
  const pricedTotal = priced.reduce(
    (s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0),
    0,
  )
  const totals =
    kind === 'order'
      ? [
          { label: 'TOTAL', value: money(data.total_price), bold: false },
          ...(Number(data.discount) > 0 ? [{ label: 'DISCOUNT', value: money(data.discount) }] : []),
          ...(Number(data.deposit) > 0 ? [{ label: 'DEPOSIT', value: money(data.deposit) }] : []),
          { label: 'BALANCE', value: money(data.balance), bold: true, fill: BRAND.goldLight },
        ]
      : priced.length === 0
        ? [{ label: 'TOTAL', value: 'N/A', bold: true, fill: BRAND.goldLight }]
        : [{ label: 'TOTAL', value: money(pricedTotal), bold: true, fill: BRAND.goldLight }]

  y = drawTable(doc, data.items, y, totals)
  y += 4
  y = drawBlocks(doc, y, kind === 'quotation')
  drawFooter(doc)

  const fname = kind === 'quotation' ? data.name : data.customer_name
  doc.save(`${kind === 'quotation' ? 'Quotation' : 'Order'}-${data.id}-${String(fname || '').replace(/\s+/g, '-')}.pdf`)
}

function firstOf(name) {
  return String(name || '').split(' ')[0] || 'Customer'
}

export function downloadQuotationPdf(quotation) {
  return buildPdf('quotation', quotation)
}

export function downloadOrderPdf(order) {
  return buildPdf('order', order)
}
