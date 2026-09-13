import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../../api'
import { Button, btnGold, formatDateTime, InlineAlert, input, SelectField, StatusBadge } from '../../components/ui'
import { downloadQuotationPdf } from '../../pdf/quotePdf'
import { Download, Pencil, Plus, Trash2, Undo2, X } from 'lucide-react'
import { AdminFilters, AdminListing, AdminListState, AdminPageHeader } from '../../components/admin/AdminUI'
import useAdminData from '../../components/admin/useAdminData'

const statusFilters = [
  ['', 'All Statuses'],
  ['new', 'New'],
  ['replied', 'Replied'],
  ['closed', 'Closed'],
]

const sourceFilters = [
  ['', 'All Sources'],
  ['web', 'Website Requests'],
  ['manual', 'My Quotations'],
]

const emptyLine = { description: '', quantity: 1, unit_price: 0, price_na: false, mode: 'list', item_id: null }

const blankQuote = {
  id: null,
  name: '',
  phone: '',
  email: '',
  event_type: '',
  event_date: '',
  venue: '',
  message: '',
  status: 'new',
  reply: '',
  items_requested: '',
  items: [],
}

export default function Quotations() {
  const [search, setSearch] = useState('')
  const [actionError, setActionError] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [reply, setReply] = useState('')
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [catalog, setCatalog] = useState([])
  const catalogRef = useRef(catalog)
  catalogRef.current = catalog

  useEffect(() => {
    api
      .get('/items/')
      .then(({ data }) => setCatalog(data.results || data))
      .catch(() => setCatalog([]))
  }, [])

  const groupedCatalog = useMemo(() => {
    const g = {}
    for (const it of catalog) {
      ;(g[it.category_display || 'Others'] ||= []).push(it)
    }
    return g
  }, [catalog])

  const findCatalogItem = (description) => {
    const needle = String(description || '').toLowerCase().trim()
    if (!needle) return null
    return catalog.find((it) => it.name.toLowerCase() === needle) || null
  }

  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (source) params.set('source', source)
  const { data, loading, error, load } = useAdminData(`/quotations/?${params}`)
  const list = (data || []).filter((q) => `${q.name} ${q.phone || ''} ${q.email || ''} ${q.venue || ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  const active = [search && `Search: ${search}`, status && `Status: ${statusFilters.find(([value]) => value === status)?.[1]}`, source && `Source: ${sourceFilters.find(([value]) => value === source)?.[1]}`].filter(Boolean)
  const clear = () => { setSearch(''); setStatus(''); setSource('') }

  const openEdit = (q) => {
    setCreating(false)
    setFormError('')
    setSelected(q)
    setReply(q.reply || '')
    const saved = q.items || []
    setItems(
      saved.length > 0
        ? saved.map((i) => {
            const match = findCatalogItem(i.description)
            return {
              ...i,
              price_na: Boolean(i.price_na),
              mode: match ? 'list' : 'custom',
              item_id: match ? match.id : null,
            }
          })
        : [{ ...emptyLine }],
    )
  }

  const openCreate = () => {
    setCreating(true)
    setFormError('')
    setSelected({ ...blankQuote })
    setReply('')
    setItems([{ ...emptyLine }])
  }

  const closeEditor = () => {
    setSelected(null)
    setCreating(false)
  }

  const setField = (k, v) => setSelected((q) => ({ ...q, [k]: v }))

  const updateLine = (idx, k, v) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [k]: v } : it)))

  const onPickItem = (idx, value) => {
    if (value === '__custom__') {
      updateLine(idx, 'mode', 'custom')
      updateLine(idx, 'item_id', null)
      updateLine(idx, 'description', '')
      return
    }
    if (!value) {
      updateLine(idx, 'mode', 'list')
      updateLine(idx, 'item_id', null)
      updateLine(idx, 'description', '')
      return
    }
    const item = catalog.find((i) => i.id === Number(value))
    if (!item) return
    updateLine(idx, 'mode', 'list')
    updateLine(idx, 'item_id', Number(value))
    updateLine(idx, 'description', item.color ? `${item.name} (${item.color})` : item.name)
    updateLine(idx, 'unit_price', Number(item.rental_price || 0))
    updateLine(idx, 'price_na', Number(item.rental_price || 0) <= 0)
  }

  const addLine = () => setItems((arr) => [...arr, { ...emptyLine }])

  const removeLine = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx))

  const pricedTotal = useMemo(
    () =>
      items
        .filter((it) => !it.price_na)
        .reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0),
    [items],
  )

  const buildReplyText = () => {
    const lines = items
      .filter((it) => it.description.trim())
      .map((it) => {
        const qty = Number(it.quantity || 0)
        if (it.price_na) return `- ${it.description} x${qty} (price TBA)`
        const unit = Number(it.unit_price || 0)
        return `- ${it.description} x${qty} @ P${unit.toLocaleString('en-PH', { minimumFractionDigits: 2 })} = P${(qty * unit).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
      })
    if (lines.length === 0) return ''
    const name = (selected?.name || 'Customer').split(' ')[0]
    const totalText =
      items.filter((it) => !it.price_na && it.description.trim()).length === 0
        ? 'TOTAL: N/A (price to be confirmed)'
        : `TOTAL: P${pricedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    return [
      `Dear ${name}, thank you for your inquiry! Here is our proposal:`,
      ...lines,
      totalText,
      'Mode of payment: 50% Down Payment; Full Payment upon delivery.',
      '- Jan & Jimels Party Needs',
    ].join('\n')
  }

  const save = async () => {
    if (!selected) return
    setFormError('')
    if (!selected.name.trim()) {
      setFormError('Customer name is required.')
      return
    }
    setSaving(true)
    try {
      const cleanItems = items
        .filter((it) => it.description.trim())
        .map((it) => ({
          description: it.description,
          quantity: Number(it.quantity || 0),
          unit_price: it.price_na ? 0 : Number(it.unit_price || 0),
          price_na: Boolean(it.price_na),
        }))
      const payload = {
        name: selected.name,
        phone: selected.phone || '',
        email: selected.email || '',
        event_type: selected.event_type || '',
        event_date: selected.event_date || null,
        venue: selected.venue || '',
        items_requested: selected.items_requested || '',
        message: selected.message || '',
        status: selected.status || 'new',
        reply: reply || buildReplyText(),
        items: cleanItems,
      }
      if (creating) {
        await api.post('/quotations/', payload)
      } else {
        await api.put(`/quotations/${selected.id}/`, payload)
      }
      closeEditor()
      load()
    } catch (err) {
      setFormError('Could not save the quotation. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const pdfData = (q) => {
    const lines =
      q.items && q.items.length > 0
        ? q.items
        : (q.items_requested || '')
            .split('\n')
            .filter(Boolean)
            .map((line) => ({ description: line, quantity: 1, unit_price: 0, price_na: false }))
    return {
      id: q.id || null,
      date: new Date(q.created_at || Date.now()).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
      name: q.name,
      phone: q.phone,
      email: q.email,
      address: q.venue || '',
      event_type: q.event_type,
      event_date: q.event_date,
      venue: q.venue,
      items: lines,
    }
  }

  const remove = async (q) => {
    if (!window.confirm(`Delete request from ${q.name}?`)) return
    setActionError('')
    try { await api.delete(`/quotations/${q.id}/`); load() }
    catch { setActionError('Could not delete this quotation. Try again using its Delete action.') }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Quotations & Inquiries" description="Website requests and quotations you create — with your own prices." action={<Button variant="conversion" onClick={openCreate}><Plus size={18} aria-hidden="true" />New Quotation</Button>} />
      <AdminFilters search={search} onSearch={setSearch} searchLabel="Search quotations" searchHint="Search contact details and venues in the loaded records." active={active} onClear={clear}>
        <SelectField label="Quotation status" value={status} onChange={(e) => setStatus(e.target.value)}>{statusFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
        <SelectField label="Source" value={source} onChange={(e) => setSource(e.target.value)}>{sourceFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
      </AdminFilters>
      {actionError && <InlineAlert tone="error">{actionError}</InlineAlert>}
      <AdminListState name="Quotations" loading={loading} error={error} count={list.length} filtered={active.length > 0} onRetry={load} onClear={clear}>
        <AdminListing name="Quotations" records={list} columns={[
          { key: 'customer', label: 'Customer', render: (q) => <>{q.name}<span className="admin-secondary">{[q.phone, q.email].filter(Boolean).join(' · ') || 'No contact given'}</span></> },
          { key: 'event', label: 'Event / venue', render: (q) => <>{q.event_type || '—'} · {q.event_date || 'No date'}<span className="admin-secondary">{q.venue || 'No venue'}</span></> },
          { key: 'equipment', label: 'Equipment', render: (q) => q.items?.length ? q.items.map((i) => `${i.description}${i.price_na ? ' (N/A)' : ''}`).join(' · ') : q.items_requested || '—' },
          { key: 'status', label: 'Status', render: (q) => <StatusBadge status={q.status} label={q.status_display} /> },
          { key: 'source', label: 'Source', render: (q) => <StatusBadge status={q.source === 'manual' ? 'confirmed' : 'completed'} label={q.source === 'manual' ? 'Manual' : 'Web request'} /> },
          { key: 'created', label: 'Received', render: (q) => formatDateTime(q.created_at) },
        ]} actions={(q) => <><Button variant="secondary" aria-label={`Edit quotation ${q.id} for ${q.name}`} onClick={() => openEdit(q)}><Pencil size={16} aria-hidden="true" />Edit</Button><Button variant="ghost" aria-label={`Download PDF for quotation ${q.id}`} onClick={() => downloadQuotationPdf(pdfData(q))}><Download size={16} aria-hidden="true" />PDF</Button><Button variant="danger" aria-label={`Delete quotation ${q.id} for ${q.name}`} onClick={() => remove(q)}><Trash2 size={16} aria-hidden="true" />Delete</Button></>} />
      </AdminListState>

      {selected && (
        <Modal title={creating ? 'New Quotation' : `Quotation — ${selected.name}`} onClose={closeEditor}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Customer name *</p>
                <input className={input} value={selected.name} onChange={(e) => setField('name', e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Phone</p>
                <input className={input} value={selected.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="09XX-XXX-XXXX" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Email</p>
                <input className={input} value={selected.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@email.com" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Event type</p>
                <select className={input} value={selected.event_type} onChange={(e) => setField('event_type', e.target.value)}>
                  <option value="">Select…</option>
                  {['Wedding', 'Debut', 'Birthday', 'Christening', 'Corporate', 'Anniversary', 'Fiesta', 'Other'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Event date</p>
                <input type="date" className={input} value={selected.event_date || ''} onChange={(e) => setField('event_date', e.target.value)} />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Status</p>
                <select className={input} value={selected.status} onChange={(e) => setField('status', e.target.value)}>
                  <option value="new">New</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Venue</p>
                <input className={input} value={selected.venue} onChange={(e) => setField('venue', e.target.value)} placeholder="Village clubhouse, Cainta…" />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-wide text-navy-700 uppercase">
                  Line items &amp; prices
                </p>
                <button type="button" onClick={addLine} className="text-sm font-semibold text-gold-600 transition hover:text-gold-500">
                  <Plus size={16} className="admin-inline-icon" aria-hidden="true" /> Add line
                </button>
              </div>
              <p className="mb-2 text-xs text-navy-500">
                Pick from the Pricelist 3 items — or choose <span className="font-semibold">Custom item…</span> at
                the bottom of the list for special pricing.
              </p>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-12">
                    {it.mode === 'list' ? (
                      <select
                        className={`${input} sm:col-span-6`}
                        value={it.item_id || ''}
                        onChange={(e) => onPickItem(idx, e.target.value)}
                      >
                        <option value="">Select from pricelist…</option>
                        {Object.entries(groupedCatalog).map(([cat, list]) => (
                          <optgroup key={cat} label={cat}>
                            {list.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name}
                                {i.color ? ` (${i.color})` : ''} —{' '}
                                {Number(i.rental_price) > 0
                                  ? `P${Number(i.rental_price).toLocaleString('en-PH')}`
                                  : 'no rate'}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="__custom__">Custom item…</option>
                      </select>
                    ) : (
                      <div className="flex gap-2 sm:col-span-6">
                        <input
                          className={input}
                          placeholder="Custom item description (e.g. Bubble Machine)"
                          value={it.description}
                          onChange={(e) => updateLine(idx, 'description', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateLine(idx, 'mode', 'list')
                            updateLine(idx, 'item_id', null)
                          }}
                          className="shrink-0 rounded-xl border border-navy-200 px-3 text-xs font-semibold text-navy-600 transition hover:border-gold-500"
                          title="Choose from the pricelist instead"
                        >
                          <Undo2 size={16} className="admin-inline-icon" aria-hidden="true" /> list
                        </button>
                      </div>
                    )}
                    <input
                      type="number"
                      min={1}
                      className={`${input} sm:col-span-2`}
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${input} sm:col-span-2`}
                      placeholder="Price"
                      disabled={it.price_na}
                      value={it.price_na ? '' : it.unit_price}
                      onChange={(e) => updateLine(idx, 'unit_price', e.target.value)}
                    />
                    <label className="flex items-center justify-center gap-1.5 rounded-xl border border-navy-100 text-xs font-semibold text-navy-700 sm:col-span-1">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-amber-500"
                        checked={Boolean(it.price_na)}
                        onChange={(e) => updateLine(idx, 'price_na', e.target.checked)}
                      />
                      N/A
                    </label>
                    <button
                      type="button"
                      aria-label={`Remove quotation line ${idx + 1}`}
                      onClick={() => removeLine(idx)}
                      className="rounded-xl border border-red-200 text-sm font-bold text-red-500 transition hover:bg-red-50 sm:col-span-1"
                    >
                      <Trash2 size={18} className="mx-auto" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-right text-sm">
                Total:{' '}
                <span className="font-display text-lg font-bold text-gold-700">
                  {items.some((it) => it.description.trim() && !it.price_na)
                    ? `P${pricedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                    : 'N/A'}
                </span>
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-wide text-navy-700 uppercase">
                  Reply / quotation message
                </p>
                <button
                  type="button"
                  onClick={() => setReply(buildReplyText())}
                  className="text-xs font-semibold text-gold-600 transition hover:text-gold-500"
                >
                  <Pencil size={16} className="admin-inline-icon" aria-hidden="true" /> Generate reply from lines
                </button>
              </div>
              <textarea
                rows={5}
                className={input}
                placeholder="Dear …, thank you for your inquiry! Here is your quotation: …"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
            </div>

            {formError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                onClick={() => downloadQuotationPdf(pdfData({ ...selected, items }))}
              >
                <Download size={16} className="admin-inline-icon" aria-hidden="true" /> Download Quotation PDF
              </button>
              <button
                className={btnGold}
                disabled={saving}
                onClick={save}
              >
                {saving ? 'Saving…' : creating ? 'Create Quotation' : 'Save Quotation'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, title, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
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
