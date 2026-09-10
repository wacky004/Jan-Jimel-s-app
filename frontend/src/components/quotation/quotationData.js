export const eventTypes = ['Wedding', 'Debut', 'Birthday', 'Christening', 'Corporate', 'Anniversary', 'Other']
export const PRICELIST_GROUPS = [
  ['chairs', 'Chairs'], ['tables', 'Tables'], ['linens', 'Linen & Décor'],
  ['tents', 'Tent'], ['glassware', 'Equipment'], ['covers', 'Covers & Sashes'],
  ['decor', 'Décor'], ['sound_light', 'Sound & Lights'], ['other', 'Others'],
]
const categoryLabels = {
  'Chairs': 'chairs', 'Tables': 'tables', 'Linens & Cloths': 'linens',
  'Tents & Canopies': 'tents', 'Glassware & Tableware': 'glassware',
  'Covers & Sashes': 'covers', 'Décor': 'decor', 'Sound & Lights': 'sound_light', 'Other': 'other',
}
export function categoryKey(value) { return categoryLabels[value] || value }
export function groupCatalog(items) {
  const groups = {}
  for (const item of items) (groups[categoryKey(item.category)] ||= []).push(item)
  return groups
}
export const initialForm = { name: '', phone: '', email: '', event_type: '', event_date: '', venue: '', items_requested: '', message: '' }
export const steps = ['Event details', 'Equipment selection', 'Contact details and review']
export function fieldStep(key) {
  return ['event_type', 'event_date', 'venue'].includes(key) ? 0 : ['name', 'phone', 'email'].includes(key) ? 2 : 1
}

export function buildPayload(form, selected, others, items) {
  const lines = Object.entries(selected).map(([id, qty]) => {
    const it = items.find((i) => i.id === Number(id))
    return `${it?.name || 'Item'} x${qty}`
  })
  const otherLines = others.map((o) => `Other equipment: ${o.name} x${o.qty}`)
  return {
    ...form,
    event_date: form.event_date || null,
    items_requested: [...lines, ...otherLines, form.items_requested].filter(Boolean).join('\n'),
  }
}

export function validateEvent(form) {
  const errors = {}
  if (form.event_type.length > 80) errors.event_type = 'Use 80 characters or fewer for the event type.'
  if (form.venue.length > 200) errors.venue = 'Use 200 characters or fewer for the venue.'
  if (form.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.event_date)) errors.event_date = 'Enter a valid event date.'
  return errors
}
export function validateContact(form, emailValid = true) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter your full name.'
  else if (form.name.length > 150) errors.name = 'Use 150 characters or fewer for your name.'
  if (!form.phone.trim() && !form.email.trim()) {
    errors.phone = 'Provide a phone number or email address so we can contact you.'
    errors.email = 'Provide an email address or phone number so we can contact you.'
  }
  if (form.phone.length > 30) errors.phone = 'Use 30 characters or fewer for your phone number.'
  if (form.email && (!emailValid || form.email.length > 254)) errors.email = 'Enter a valid email address.'
  return errors
}
export function validQuantity(value) { return Number.isSafeInteger(Number(value)) && Number(value) >= 1 }
