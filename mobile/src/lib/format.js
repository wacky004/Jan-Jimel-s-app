export function formatPHP(n) {
  return `PHP ${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export function formatPHPShort(n) {
  const value = Number(n || 0)
  return value % 1 === 0
    ? `PHP ${value.toLocaleString('en-PH')}`
    : `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export function formatDate(d) {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function todayISO() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function quoteFileName(customerName, dateISO) {
  const safe = String(customerName || 'Customer')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'Customer'
  return `Quotation-${safe}-${dateISO || todayISO()}.pdf`
}

export function newId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`
}
