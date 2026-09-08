import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../api'
import { btnGold, btnGhost, formatPHP, input, label, StatusBadge } from '../../components/ui'
import { ITEM_PHOTO_OPTIONS } from '../../images'

const categories = [
  ['', 'All Categories'],
  ['chairs', 'Chairs'],
  ['tables', 'Tables'],
  ['linens', 'Linens & Cloths'],
  ['covers', 'Covers & Sashes'],
  ['tents', 'Tents & Canopies'],
  ['sound_light', 'Sound & Lights'],
  ['decor', 'Décor'],
  ['glassware', 'Glassware & Tableware'],
  ['other', 'Other'],
]

const empty = {
  name: '',
  category: 'other',
  quantity_on_hand: 0,
  condition: 'good',
  color: '',
  size: '',
  rental_price: 0,
  low_stock_threshold: 3,
  notes: '',
}

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const category = searchParams.get('category') || ''
  const lowStockOnly = searchParams.get('low_stock') === 'true'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      if (lowStockOnly) params.set('low_stock', 'true')
      const { data } = await api.get(`/items/?${params}`)
      setItems(data.results || data)
    } finally {
      setLoading(false)
    }
  }, [category, search, lowStockOnly])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const summary = useMemo(() => {
    const s = { onHand: 0, inUse: 0, available: 0, value: 0 }
    for (const i of items) {
      s.onHand += i.quantity_on_hand
      s.inUse += i.quantity_in_use
      s.available += i.quantity_available
      s.value += i.quantity_on_hand * Number(i.rental_price)
    }
    return s
  }, [items])

  const remove = async (i) => {
    if (!window.confirm(`Delete "${i.name}" from inventory?`)) return
    await api.delete(`/items/${i.id}/`)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-900">Inventory</h2>
          <p className="text-sm text-navy-600">
            Track all used clothes, linens and other party needs.
          </p>
        </div>
        <button className={btnGold} onClick={() => { setEditing(null); setShowForm(true) }}>
          + Add Item
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard label="On Hand" value={summary.onHand} color="text-navy-900" />
        <SummaryCard label="In Use (out)" value={summary.inUse} color="text-purple-600" />
        <SummaryCard label="Available" value={summary.available} color="text-green-600" />
        <SummaryCard label="Inventory Value" value={formatPHP(summary.value)} color="text-gold-600" />
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className={`${input} max-w-xs`}
          placeholder="🔍 Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${input} w-auto`}
          value={category}
          onChange={(e) => setSearchParams(e.target.value ? { category: e.target.value } : {})}
        >
          {categories.map(([v, l]) => (
            <option key={v || 'all'} value={v}>{l}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm font-medium text-navy-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-gold-500"
            checked={lowStockOnly}
            onChange={(e) =>
              setSearchParams(e.target.checked ? { ...Object.fromEntries(searchParams), low_stock: 'true' } : {})
            }
          />
          Low stock only
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60 text-[11px] tracking-wider text-navy-600 uppercase">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">On Hand</th>
              <th className="px-4 py-3">In Use</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Rate / Day</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-navy-500">Loading inventory…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-navy-500">No items found.</td></tr>
            ) : (
              items.map((i) => (
                <tr key={i.id} className="border-b border-navy-50 transition last:border-0 hover:bg-gold-500/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy-900">{i.name}</span>
                      {i.is_low_stock && <StatusBadge status="pending" label="Low Stock" />}
                    </div>
                    <p className="text-xs text-navy-500">
                      {[i.color, i.size].filter(Boolean).join(' · ') || 'No variant'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{i.category_display}</td>
                  <td className="px-4 py-3 font-semibold text-navy-900">{i.quantity_on_hand}</td>
                  <td className="px-4 py-3 text-purple-600">{i.quantity_in_use}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">{i.quantity_available}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={i.condition === 'good' ? 'delivered' : i.condition === 'used' ? 'confirmed' : 'cancelled'}
                      label={i.condition_display}
                    />
                  </td>
                  <td className="px-4 py-3 text-navy-800">{formatPHP(i.rental_price)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-700 transition hover:border-gold-500 hover:text-gold-600"
                      onClick={() => { setEditing(i); setShowForm(true) }}
                    >
                      Edit
                    </button>
                    <button
                      className="ml-2 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                      onClick={() => remove(i)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? 'Edit Item' : 'Add Item'}>
          <ItemForm
            initial={editing}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); load() }}
          />
        </Modal>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-navy-500 uppercase">{label}</p>
      <p className={`font-display mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function ItemForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? { ...initial } : empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Item name is required.')
    setSaving(true)
    try {
      if (form.id) await api.put(`/items/${form.id}/`, form)
      else await api.post('/items/', form)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save the item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Item Name *</label>
          <input className={input} value={form.name} onChange={set('name')} placeholder="e.g. Table Cloth (Round)" />
        </div>
        <div>
          <label className={label}>Category</label>
          <select className={input} value={form.category} onChange={set('category')}>
            {categories.slice(1).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Condition</label>
          <select className={input} value={form.condition} onChange={set('condition')}>
            <option value="good">Good</option>
            <option value="used">Used</option>
            <option value="worn">Worn</option>
          </select>
        </div>
        <div>
          <label className={label}>Quantity On Hand</label>
          <input type="number" min={0} className={input} value={form.quantity_on_hand} onChange={set('quantity_on_hand')} />
        </div>
        <div>
          <label className={label}>Rental Price / Day (₱)</label>
          <input type="number" min={0} step="0.01" className={input} value={form.rental_price} onChange={set('rental_price')} />
        </div>
        <div>
          <label className={label}>Color</label>
          <input className={input} value={form.color} onChange={set('color')} placeholder="e.g. white, gold" />
        </div>
        <div>
          <label className={label}>Size</label>
          <input className={input} value={form.size} onChange={set('size')} placeholder="e.g. 120 inches" />
        </div>
        <div>
          <label className={label}>Low Stock Alert At</label>
          <input type="number" min={0} className={input} value={form.low_stock_threshold} onChange={set('low_stock_threshold')} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Notes</label>
          <textarea rows={2} className={input} value={form.notes} onChange={set('notes')} placeholder="Storage notes, supplier, etc." />
        </div>
      </div>

      <div className="sm:col-span-2 rounded-2xl border border-navy-100 bg-navy-50/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-navy-700 uppercase">
              Item Photo (shown on the quotation page)
            </p>
            <p className="mt-0.5 text-xs text-navy-500">
              Click a photo below to assign it to this item, so customers can identify it.
            </p>
          </div>
          {form.photo_url ? (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, photo_url: '' }))}
              className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
            >
              ✕ Remove photo
            </button>
          ) : (
            <span className="text-xs text-navy-400">No photo assigned</span>
          )}
        </div>

        {form.photo_url && (
          <img
            src={form.photo_url}
            alt="Selected item photo"
            className="mt-3 h-28 w-44 rounded-xl border-2 border-gold-500 object-cover shadow"
          />
        )}

        <div className="mt-3 grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-xl bg-white p-3 sm:grid-cols-6">
          {ITEM_PHOTO_OPTIONS.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setForm((f) => ({ ...f, photo_url: src }))}
              className={`overflow-hidden rounded-lg border-2 transition ${
                form.photo_url === src ? 'border-gold-500 ring-2 ring-gold-500/40' : 'border-transparent hover:border-navy-300'
              }`}
            >
              <img src={src} alt="" loading="lazy" className="h-14 w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
        <button type="submit" disabled={saving} className={btnGold}>
          {saving ? 'Saving…' : form.id ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  )
}

function Modal({ children, title, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-3xl border-b border-navy-100 bg-white px-6 py-4">
          <h3 className="font-display text-lg font-bold text-navy-900">{title}</h3>
          <button onClick={onClose} className="text-navy-500 transition hover:text-navy-900" aria-label="Close">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
