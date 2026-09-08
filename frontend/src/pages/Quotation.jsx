import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import api from '../api'

const eventTypes = ['Wedding', 'Debut', 'Birthday', 'Christening', 'Corporate', 'Anniversary', 'Other']

export default function Quotation() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState({})
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    event_type: '',
    event_date: '',
    venue: '',
    items_requested: '',
    message: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    api
      .get('/quotations/public/items/')
      .then(({ data }) => setItems(data))
      .catch(() => {})
  }, [])

  const grouped = useMemo(() => {
    const g = {}
    for (const it of items) {
      ;(g[it.category] ||= []).push(it)
    }
    return g
  }, [items])

  const filtered = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return items.filter((i) => i.name.toLowerCase().includes(q))
  }, [items, search])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleItem = (item) => {
    setSelected((s) => {
      const next = { ...s }
      if (next[item.id]) delete next[item.id]
      else next[item.id] = 1
      return next
    })
  }

  const changeQty = (id, delta) => {
    setSelected((s) => {
      const next = { ...s, [id]: Math.max(0, (s[id] || 0) + delta) }
      if (next[id] === 0) delete next[id]
      return next
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.phone.trim() && !form.email.trim()) {
      setError('Please provide your phone number or email address so we can contact you.')
      return
    }
    const lines = Object.entries(selected).map(([id, qty]) => {
      const it = items.find((i) => i.id === Number(id))
      return `${it?.name || 'Item'} x${qty}`
    })
    const payload = {
      ...form,
      event_date: form.event_date || null,
      items_requested: [...lines, form.items_requested].filter(Boolean).join('\n'),
    }
    setSubmitting(true)
    try {
      await api.post('/quotations/public/submit/', payload)
      setDone(true)
    } catch (err) {
      setError('Something went wrong. Please try again or call 0908-950-3879.')
    } finally {
      setSubmitting(false)
    }
  }

  const input =
    'w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 placeholder-navy-300 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30'
  const label = 'mb-1.5 block text-xs font-semibold tracking-wide text-navy-800 uppercase'

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">
            Free Quotation
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold text-white sm:text-5xl">
            Request a <span className="text-gradient-gold">Quote</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70">
            Fill in your event details and pick the items you need. We'll contact you with
            pricing and availability — usually within the day.
          </p>
        </motion.div>

        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto mt-12 max-w-lg rounded-3xl border border-gold-500/30 bg-white/5 p-10 text-center backdrop-blur"
          >
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <h2 className="font-display mt-6 text-2xl font-bold text-white">Request Sent!</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Salamat, {form.name}! Your quotation request has been received. Our team will
              reach out to you{form.phone ? ` at ${form.phone}` : ` via ${form.email}`} shortly.
              For urgent bookings, call us at 0908-950-3879.
            </p>
            <a
              href="/"
              className="mt-8 inline-block rounded-full bg-gold-500 px-8 py-3 text-sm font-semibold text-navy-950 transition hover:bg-gold-400"
            >
              Back to Home
            </a>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            onSubmit={submit}
            className="mt-12 space-y-8 rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-navy-950/40 sm:p-10"
          >
            {/* Contact details */}
            <div>
              <h2 className="font-display text-lg font-bold text-navy-900">Your Details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={label}>Full Name *</label>
                  <input required className={input} placeholder="e.g. Maria Santos" value={form.name} onChange={set('name')} />
                </div>
                <div>
                  <label className={label}>Phone Number</label>
                  <input className={input} placeholder="09XX-XXX-XXXX" value={form.phone} onChange={set('phone')} />
                </div>
                <div>
                  <label className={label}>Email Address</label>
                  <input type="email" className={input} placeholder="you@email.com" value={form.email} onChange={set('email')} />
                </div>
                <p className="text-xs text-navy-500 sm:col-span-2">
                  * Provide at least a phone number or an email address so we can send your quotation.
                </p>
              </div>
            </div>

            {/* Event details */}
            <div>
              <h2 className="font-display text-lg font-bold text-navy-900">Event Details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Event Type</label>
                  <select className={input} value={form.event_type} onChange={set('event_type')}>
                    <option value="">Select event type…</option>
                    {eventTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Event Date</label>
                  <input type="date" className={input} value={form.event_date} onChange={set('event_date')} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Venue / Location</label>
                  <input className={input} placeholder="e.g. Village Clubhouse, Cainta" value={form.venue} onChange={set('venue')} />
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h2 className="font-display text-lg font-bold text-navy-900">
                Items You Need{' '}
                <span className="text-sm font-normal text-navy-500">
                  ({Object.keys(selected).length} selected)
                </span>
              </h2>
              <div className="mt-4">
                <input
                  className={input}
                  placeholder="🔍 Search items (e.g. chair, tent, lights)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {filtered ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {filtered.map((it) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      qty={selected[it.id] || 0}
                      onToggle={() => toggleItem(it)}
                      onQty={changeQty}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-sm text-navy-500 sm:col-span-2">No items match your search.</p>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-5">
                  {Object.entries(grouped).map(([category, list]) => (
                    <div key={category}>
                      <p className="mb-2 text-xs font-bold tracking-widest text-gold-600 uppercase">{category}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {list.map((it) => (
                          <ItemRow
                            key={it.id}
                            item={it}
                            qty={selected[it.id] || 0}
                            onToggle={() => toggleItem(it)}
                            onQty={changeQty}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className={label}>Additional Notes / Specific Requests</label>
              <textarea
                rows={4}
                className={input}
                placeholder="Tell us more about your event — theme colors, number of guests, special requests…"
                value={form.items_requested}
                onChange={set('items_requested')}
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-gold-500 py-4 text-sm font-bold tracking-wide text-navy-950 shadow-xl shadow-gold-500/25 transition hover:bg-gold-400 disabled:opacity-60"
            >
              {submitting ? 'Sending your request…' : 'Submit Quotation Request'}
            </button>
          </motion.form>
        )}
      </div>
    </div>
  )
}

function ItemRow({ item, qty, onToggle, onQty }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
        qty > 0 ? 'border-gold-500 bg-gold-500/10' : 'border-navy-100 bg-navy-50/50 hover:border-navy-200'
      }`}
    >
      <button type="button" onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold text-white transition ${
            qty > 0 ? 'border-gold-500 bg-gold-500' : 'border-navy-300 bg-white'
          }`}
        >
          {qty > 0 ? '✓' : ''}
        </span>
        <span>
          <span className="block text-sm font-medium text-navy-900">{item.name}</span>
          <span className="block text-xs text-navy-500">
            {[item.color, item.size].filter(Boolean).join(' · ') || '—'} · ₱{Number(item.rental_price).toLocaleString()} / day
          </span>
        </span>
      </button>
      {qty > 0 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onQty(item.id, -1)}
            className="h-7 w-7 rounded-full border border-navy-200 text-sm font-bold text-navy-700 transition hover:bg-navy-100"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-bold text-navy-900">{qty}</span>
          <button
            type="button"
            onClick={() => onQty(item.id, 1)}
            className="h-7 w-7 rounded-full border border-navy-200 text-sm font-bold text-navy-700 transition hover:bg-navy-100"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}
