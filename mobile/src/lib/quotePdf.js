import { quoteFileName } from './format'

const BRAND = {
  navy: [20, 39, 77],
  navyDeep: [7, 17, 38],
  gold: [212, 175, 55],
  goldLight: [240, 212, 122],
  white: [255, 255, 255],
  gray: [110, 122, 140],
  light: [241, 245, 249],
}

export const SHOP = {
  name: 'JAN & JIMELS PARTY NEEDS',
  tagline: 'Event Rentals & Supplies | Est. 1995',
  address: 'No. 01 Pelota Street, New St. Francis Village, San Juan, Cainta, Rizal',
  tel: 'Tel. No.: 0908-950-3879 | 0999-760-3211',
  email: 'janjimels95@gmail.com',
  signature: 'JENNIFER SAN JUAN',
  title: 'Proprietor, Jan & Jimels Party Needs',
  paymentMode: '50% Down Payment; Full Payment upon delivery.',
  terms: [
    'Items will be inspected before and after the rental.',
    'Customers may be charged additional fees if there is damage or loss of items.',
    'Prices are subject to change without prior notice.',
  ],
}

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
  return `PHP ${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
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
  let logo = null
  try {
    logo = await loadLogo()
  } catch {
    logo = null
  }
  doc.setFillColor(...BRAND.navy)
  doc.rect(0, 0, 210, 46, 'F')
  doc.setFillColor(...BRAND.gold)
  doc.rect(0, 46, 210, 1.2, 'F')

  doc.setFillColor(...BRAND.white)
  doc.setDrawColor(...BRAND.gold)
  doc.setLineWidth(0.8)
  doc.roundedRect(10, 9, 28.5, 28.5, 2, 2, 'FD')
  if (logo) {
    try {
      doc.addImage(logo, 'JPEG', 11.5, 10.5, 25.5, 25.5)
    } catch {
      /* logo failed — text header still stands */
    }
  }

  doc.setDrawColor(...BRAND.gold)
  doc.setLineWidth(0.5)
  doc.line(108, 10, 108, 38)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...BRAND.white)
  doc.text('JAN & JIMELS', 45, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND.goldLight)
  doc.text('EVENT RENTALS & SUPPLIES', 45, 26.5)
  doc.text('EST. 1995 | CAINTA, RIZAL', 45, 31)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.6)
  doc.setTextColor(...BRAND.white)
  const addrLines = doc.splitTextToSize(SHOP.address, 82)
  doc.text(addrLines.slice(0, 2), 198, 15, { align: 'right' })
  const telLines = doc.splitTextToSize(SHOP.tel, 78)
  doc.text(telLines.slice(0, 1), 198, 25.5, { align: 'right' })
  doc.text(SHOP.email, 198, 30.5, { align: 'right' })
}

function drawTable(doc, lines, startY) {
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

  lines.forEach((it, i) => {
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
    const desc = it.isPackage ? `${it.name} (Package)` : it.name
    const descLines = doc.splitTextToSize(desc, 105)
    doc.text(descLines, colItem + 3, y)
    doc.text(String(it.qty), colQty, y, { align: 'right' })
    doc.text(money(it.unitPrice), colUnit, y, { align: 'right' })
    doc.text(money(Number(it.qty) * Number(it.unitPrice)), colAmt, y, { align: 'right' })
    y += Math.max(descLines.length, 1) * 4.6 + 4
  })

  return y
}

function drawBlocks(doc, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...BRAND.navy)
  doc.text('MODE OF PAYMENT', 12, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND.gray)
  doc.text(SHOP.paymentMode, 12, y + 11)
  y += 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...BRAND.navy)
  doc.text('TERMS AND CONDITIONS', 12, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.8)
  doc.setTextColor(...BRAND.gray)
  SHOP.terms.forEach((t, i) => {
    doc.text(`-  ${t}`, 12, y + 11 + i * 5)
  })
  y += 11 + SHOP.terms.length * 5 + 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.2)
  doc.setTextColor(...BRAND.navy)
  doc.text('Thank you for your time and for considering our proposal.', 12, y)
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

export async function buildQuotationPdfBlob(quote) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  await drawHeader(doc)
  drawFooter(doc)

  let y = 57
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...BRAND.navy)
  doc.text('QUOTATION', 105, y, { align: 'center' })
  y += 5.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...BRAND.gray)
  doc.text(`Date: ${quote.dateLabel}`, 12, y)

  y += 9
  doc.setFillColor(...BRAND.gold)
  doc.rect(12, y - 4.4, 1.6, 6.4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...BRAND.navy)
  doc.text(quote.customerName || 'Customer', 17, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.6)
  doc.setTextColor(...BRAND.gray)
  if (quote.phone) doc.text(quote.phone, 17, y + 5)
  y += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.3)
  doc.setTextColor(...BRAND.navy)
  const firstName = String(quote.customerName || 'Customer').split(' ')[0]
  doc.text(`Dear ${firstName}: We are pleased to submit to you our proposal with details as follows:`, 12, y)
  y += 8

  const boxW = 88
  const boxH = 20
  const boxY = y
  const info = [
    ['DATE OF EVENT', quote.eventDate || '-'],
    ['TYPE OF ORDER', quote.eventType || '-'],
    ['VENUE', quote.venue || '-'],
    ['PREPARED BY', 'Jan & Jimels Party Needs'],
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
    const vlines = doc.splitTextToSize(value || '-', boxW - 8)
    doc.text(vlines.slice(0, 2), bx + 4, by + 11)
  })
  y = boxY + boxH * 2 + 4 + 8

  y = drawTable(doc, quote.lines, y)

  const subtotal = quote.lines.reduce((s, it) => s + Number(it.qty) * Number(it.unitPrice || 0), 0)
  const discount = Number(quote.discount || 0)
  const deliveryFee = Number(quote.deliveryFee || 0)
  const setupFee = Number(quote.setupFee || 0)
  const total = Math.max(subtotal - discount + deliveryFee + setupFee, 0)

  // Keep the totals block on one page (up to 5 rows need ~50mm)
  if (y > 233) {
    drawFooter(doc)
    doc.addPage()
    y = 24
  }

  doc.setDrawColor(...BRAND.gold)
  doc.line(12, y, 198, y)
  y += 2
  const addTotalRow = (label, value, bold = false, fill = null) => {
    if (y > 266) {
      drawFooter(doc)
      doc.addPage()
      y = 24
    }
    if (fill) {
      doc.setFillColor(...fill)
      doc.rect(12, y - 4.2, 186, 8.4, 'F')
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 10 : 9)
    doc.setTextColor(...BRAND.navy)
    doc.text(label, 155, y, { align: 'right' })
    doc.text(value, 198, y, { align: 'right' })
    y += 9
  }
  if (discount > 0 || deliveryFee > 0 || setupFee > 0) {
    addTotalRow('SUBTOTAL', money(subtotal))
    if (discount > 0) addTotalRow('DISCOUNT', `- ${money(discount)}`)
    if (deliveryFee > 0) addTotalRow('DELIVERY FEE', `+ ${money(deliveryFee)}`)
    if (setupFee > 0) addTotalRow('SETUP FEE', `+ ${money(setupFee)}`)
  }
  addTotalRow('TOTAL', money(total), true, BRAND.goldLight)
  doc.setDrawColor(...BRAND.gold)
  doc.line(12, y - 1, 198, y - 1)

  y += 6
  if (quote.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...BRAND.navy)
    doc.text('NOTES', 12, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.8)
    doc.setTextColor(...BRAND.gray)
    const noteLines = doc.splitTextToSize(quote.notes, 180)
    doc.text(noteLines.slice(0, 3), 12, y + 5.5)
    y += 6 + Math.min(noteLines.length, 3) * 4.6
  }

  // Keep the terms/signature block on one page (~75mm)
  if (y > 205) {
    drawFooter(doc)
    doc.addPage()
    y = 24
  }

  y = drawBlocks(doc, y + 2)
  drawFooter(doc)

  const blob = doc.output('blob')
  return { blob, filename: quoteFileName(quote.customerName, quote.dateISO) }
}
