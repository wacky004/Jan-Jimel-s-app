import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../api'
import { Button, btnGold, btnGhost, CheckboxField, formatPHP, InlineAlert, input, label, SelectField, StatusBadge } from '../../components/ui'
import { ITEM_PHOTO_OPTIONS } from '../../images'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { AdminFilters, AdminListing, AdminListState, AdminPageHeader } from '../../components/admin/AdminUI'
import useAdminData from '../../components/admin/useAdminData'

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
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const category = searchParams.get('category') || ''
  const lowStockOnly = searchParams.get('low_stock') === 'true'

  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (search) params.set('search', search)
  if (lowStockOnly) params.set('low_stock', 'true')
  const { data, loading, error, load } = useAdminData(`/items/?${params}`, 250)
  const items = useMemo(() => data || [], [data])
  const active = [search && `Search: ${search}`, category && `Category: ${categories.find(([value]) => value === category)?.[1] || category}`, lowStockOnly && 'Low stock only'].filter(Boolean)
  const clear = () => { setSearch(''); setSearchParams({}) }

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
    setActionError('')
    try { await api.delete(`/items/${i.id}/`); load() }
    catch { setActionError('Could not delete this item. Try again using its Delete action.') }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Inventory" description="Track equipment, stock and rental rates." action={<Button variant="conversion" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={18} aria-hidden="true" />Add Item</Button>} />
      {!loading && !error && <div className="admin-summary" aria-label="Totals for shown inventory">
        <SummaryCard label="On Hand" value={summary.onHand} color="text-navy-900" />
        <SummaryCard label="In Use (out)" value={summary.inUse} color="admin-info" />
        <SummaryCard label="Available" value={summary.available} color="admin-success" />
        <SummaryCard label="Inventory Value" value={formatPHP(summary.value)} color="admin-gold" />
      </div>}
      <AdminFilters search={search} onSearch={setSearch} searchLabel="Search inventory" active={active} onClear={clear}>
        <SelectField label="Category" value={category} onChange={(e) => setSearchParams(e.target.value ? { category: e.target.value } : {})}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
        <CheckboxField label="Low stock only" checked={lowStockOnly} onChange={(e) => setSearchParams(e.target.checked ? { ...Object.fromEntries(searchParams), low_stock: 'true' } : {})} />
      </AdminFilters>
      {actionError && <InlineAlert tone="error">{actionError}</InlineAlert>}
      <AdminListState name="Inventory items" loading={loading} error={error} count={items.length} filtered={active.length > 0} onRetry={load} onClear={clear}>
        <AdminListing name="Inventory" records={items} columns={[
          { key: 'name', label: 'Item', render: (i) => <>{i.name}{i.is_low_stock && <StatusBadge status="pending" label="Low Stock" />}<span className="admin-secondary">{[i.color, i.size].filter(Boolean).join(' · ') || 'No variant'}</span></> },
          { key: 'category', label: 'Category', render: (i) => i.category_display },
          { key: 'onHand', label: 'On Hand', render: (i) => i.quantity_on_hand },
          { key: 'inUse', label: 'In Use', render: (i) => <span className="admin-info">{i.quantity_in_use}</span> },
          { key: 'available', label: 'Available', render: (i) => <span className="admin-success">{i.quantity_available}</span> },
          { key: 'condition', label: 'Condition', render: (i) => <StatusBadge status={i.condition === 'good' ? 'delivered' : i.condition === 'used' ? 'confirmed' : 'cancelled'} label={i.condition_display} /> },
          { key: 'rate', label: 'Rate / Day', render: (i) => formatPHP(i.rental_price) },
        ]} actions={(i) => <><Button variant="secondary" aria-label={`Edit ${i.name}`} onClick={() => { setEditing(i); setShowForm(true) }}><Pencil size={16} aria-hidden="true" />Edit</Button><Button variant="danger" aria-label={`Delete ${i.name}`} onClick={() => remove(i)}><Trash2 size={16} aria-hidden="true" />Delete</Button></>} />
      </AdminListState>

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
              <X size={16} className="admin-inline-icon" aria-hidden="true" /> Remove photo
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
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
