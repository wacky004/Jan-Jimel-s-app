import { useEffect, useMemo, useState } from 'react'
import api from '../../api'
import MapPicker from '../../components/MapPicker'
import { btnGhost, btnGold, formatPHP, input, label } from '../../components/ui'

const statuses = [
  ['pending', 'Pending'],
  ['confirmed', 'Confirmed'],
  ['out_for_delivery', 'Out for Delivery'],
  ['delivered', 'Delivered'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
]

const empty = {
  customer_name: '',
  contact_number: '',
  email: '',
  event_type: '',
  event_date: '',
  event_time: '',
  delivery_address: '',
  lat: null,
  lng: null,
  status: 'pending',
  delivery_date: '',
  total_price: '0',
  discount: '0',
  deposit: '0',
  notes: '',
  items: [],
}

export default function OrderForm({ initial, onSaved, onClose }) {
  const [form, setForm] = useState(() =>
    initial
      ? { ...initial, items: (initial.items || []).map((i) => ({ ...i, custom: !i.item })) }
      : empty,
  )
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/items/').then(({ data }) => setItems(data.results || data)).catch(() => {})
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const setItemField = (idx, k, v) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, [k]: v } : it)),
    }))

  const addItem = () => {
    const first = items[0]
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { item: first?.id || '', custom: false, custom_name: '', quantity: 1, unit_price: first?.rental_price || 0, quantity_returned: 0, notes: '' },
      ],
    }))
  }

  const addCustomItem = () => {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { item: null, custom: true, custom_name: '', quantity: 1, unit_price: 0, quantity_returned: 0, notes: '' },
      ],
    }))
  }

  const removeItem = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))

  const onPickItem = (idx, itemId) => {
    const it = items.find((i) => i.id === Number(itemId))
    setItemField(idx, 'item', Number(itemId))
    setItemField(idx, 'unit_price', it?.rental_price || 0)
    setItemField(idx, 'custom', false)
  }

  const subtotal = useMemo(
    () => form.items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0),
    [form.items],
  )
  const total = useMemo(
    () => subtotal - Number(form.discount || 0),
    [subtotal, form.discount],
  )
  const balance = useMemo(() => total - Number(form.deposit || 0), [total, form.deposit])

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.customer_name.trim()) return setError('Customer name is required.')
    if (!form.contact_number.trim()) return setError('Contact number is required.')
    if (!form.delivery_address.trim()) return setError('Delivery address is required.')
    if (form.items.length === 0) return setError('Add at least one item.')
    if (form.items.some((i) => (!i.item && !(i.custom_name || '').trim()) || !i.quantity))
      return setError('Every item needs a name and quantity.')

    setSaving(true)
    try {
      const payload = {
        ...form,
        event_date: form.event_date || null,
        event_time: form.event_time || null,
        delivery_date: form.delivery_date || null,
        total_price: total.toFixed(2),
        items: form.items.map(({ id, item_name, item_category, quantity_missing, is_custom, ...rest }) => ({
          ...rest,
          item: rest.custom ? null : Number(rest.item),
          custom_name: rest.custom ? (rest.custom_name || '').trim() : '',
          quantity: Number(rest.quantity),
          quantity_returned: Number(rest.quantity_returned || 0),
          unit_price: Number(rest.unit_price || 0),
        })),
        lat: form.lat ? String(form.lat) : null,
        lng: form.lng ? String(form.lng) : null,
      }
      if (form.id) await api.put(`/orders/${form.id}/`, payload)
      else await api.post('/orders/', payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save the order.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Customer Name *</label>
          <input className={input} value={form.customer_name} onChange={set('customer_name')} placeholder="Full name" />
        </div>
        <div>
          <label className={label}>Contact Number *</label>
          <input className={input} value={form.contact_number} onChange={set('contact_number')} placeholder="09XX-XXX-XXXX" />
        </div>
        <div>
          <label className={label}>Email</label>
          <input className={input} value={form.email} onChange={set('email')} placeholder="Optional" />
        </div>
        <div>
          <label className={label}>Event Type</label>
          <select className={input} value={form.event_type} onChange={set('event_type')}>
            <option value="">Select…</option>
            {['Wedding', 'Debut', 'Birthday', 'Christening', 'Corporate', 'Anniversary', 'Fiesta', 'Other'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Event Date</label>
          <input type="date" className={input} value={form.event_date || ''} onChange={set('event_date')} />
        </div>
        <div>
          <label className={label}>Event Time</label>
          <input type="time" className={input} value={form.event_time || ''} onChange={set('event_time')} />
        </div>
        <div>
          <label className={label}>Delivery Date</label>
          <input type="date" className={input} value={form.delivery_date || ''} onChange={set('delivery_date')} />
        </div>
        <div>
          <label className={label}>Status</label>
          <select className={input} value={form.status} onChange={set('status')}>
            {statuses.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Delivery Address *</label>
        <textarea
          rows={2}
          className={input}
          value={form.delivery_address}
          onChange={set('delivery_address')}
          placeholder="Street, Barangay, City"
        />
      </div>

      <MapPicker
        height={260}
        lat={form.lat ? Number(form.lat) : null}
        lng={form.lng ? Number(form.lng) : null}
        onPick={(la, ln) => setForm((f) => ({ ...f, lat: la, lng: ln }))}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[11px] font-semibold tracking-wide text-navy-700 uppercase">
            Items — What &amp; How Many *
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={addItem} className="text-sm font-semibold text-gold-600 transition hover:text-gold-500">
              + Add Item
            </button>
            <button type="button" onClick={addCustomItem} className="text-sm font-semibold text-navy-700 underline decoration-dotted transition hover:text-navy-500">
              + Custom equipment
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {form.items.length === 0 && (
            <p className="rounded-xl border border-dashed border-navy-200 bg-navy-50/50 px-4 py-5 text-center text-sm text-navy-500">
              No items yet. Click “+ Add Item” or “+ Custom equipment” to start.
            </p>
          )}
          {form.items.map((it, idx) => (
            <div key={idx} className={`grid gap-2 rounded-xl border p-3 sm:grid-cols-12 ${it.custom ? 'border-gold-500/50 bg-gold-500/5' : 'border-navy-100 bg-navy-50/40'}`}>
              {it.custom ? (
                <input
                  className={`${input} sm:col-span-4`}
                  placeholder="Custom equipment name (e.g. Bubble Machine)"
                  value={it.custom_name}
                  onChange={(e) => setItemField(idx, 'custom_name', e.target.value)}
                />
              ) : (
                <select
                  className={`${input} sm:col-span-4`}
                  value={it.item || ''}
                  onChange={(e) => onPickItem(idx, e.target.value)}
                >
                  <option value="">Select item…</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.color || '—'}) · {formatPHP(i.rental_price)}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="number"
                min={1}
                className={`${input} sm:col-span-2`}
                placeholder="Qty"
                value={it.quantity}
                onChange={(e) => setItemField(idx, 'quantity', e.target.value)}
              />
              <input
                type="number"
                min={0}
                step="0.01"
                className={`${input} sm:col-span-2`}
                placeholder="Price"
                value={it.unit_price}
                onChange={(e) => setItemField(idx, 'unit_price', e.target.value)}
              />
              <input
                className={`${input} sm:col-span-3`}
                placeholder="Note (color, size…)"
                value={it.notes}
                onChange={(e) => setItemField(idx, 'notes', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="rounded-xl border border-red-200 text-sm font-bold text-red-500 transition hover:bg-red-50 sm:col-span-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>Subtotal</label>
          <div className="rounded-xl bg-navy-50 px-4 py-2.5 text-sm font-semibold text-navy-800">
            {formatPHP(subtotal)}
          </div>
        </div>
        <div>
          <label className={label}>Discount</label>
          <input
            type="number" min={0} step="0.01" className={input}
            value={form.discount} onChange={set('discount')}
          />
        </div>
        <div>
          <label className={label}>Deposit</label>
          <input
            type="number" min={0} step="0.01" className={input}
            value={form.deposit} onChange={set('deposit')}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-500/40 bg-gold-500/10 px-5 py-4">
        <p className="text-sm text-navy-800">
          Total: <span className="font-display text-lg font-bold text-navy-900">{formatPHP(total)}</span>
          <span className="mx-2 text-navy-300">|</span>
          Balance: <span className="font-display text-lg font-bold text-gold-700">{formatPHP(balance)}</span>
        </p>
        <p className="text-xs text-navy-500">Balance is auto-computed.</p>
      </div>

      <div>
        <label className={label}>Notes</label>
        <textarea rows={2} className={input} value={form.notes} onChange={set('notes')} placeholder="Special instructions…" />
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
        <button type="submit" disabled={saving} className={btnGold}>
          {saving ? 'Saving…' : form.id ? 'Update Order' : 'Save Order'}
        </button>
      </div>
    </form>
  )
}
