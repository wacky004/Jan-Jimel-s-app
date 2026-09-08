const statusStyles = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-navy-100 text-navy-800 border-navy-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  new: 'bg-amber-100 text-amber-800 border-amber-200',
  replied: 'bg-blue-100 text-blue-800 border-blue-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function StatusBadge({ status, label }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
        statusStyles[status] || 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      {label || status.replaceAll('_', ' ')}
    </span>
  )
}

export const input =
  'w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder-navy-300 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30'
export const label = 'mb-1 block text-[11px] font-semibold tracking-wide text-navy-700 uppercase'
export const btnPrimary =
  'rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:opacity-50'
export const btnGold =
  'rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-gold-400 disabled:opacity-50'
export const btnGhost =
  'rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400 disabled:opacity-50'

export function formatPHP(n) {
  return `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export function formatDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(d) {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
