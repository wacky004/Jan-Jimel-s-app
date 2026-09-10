// Legacy class and formatting exports stay compatible during phased adoption.
export { Button, IconButton, TextField, SelectField, TextareaField, CheckboxField, FieldError, FormErrorSummary, InlineAlert, StatusBadge, LoadingSkeleton, EmptyState, ErrorState, ToastRegion } from './ui/primitives'
export { Dialog, ConfirmationDialog, Drawer } from './ui/overlays'

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
