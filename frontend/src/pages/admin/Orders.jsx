import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../api'
import { Button, btnGhost, formatDateTime, formatPHP, InlineAlert, SelectField, StatusBadge } from '../../components/ui'
import { downloadOrderPdf } from '../../pdf/quotePdf'
import OrderForm from './OrderForm'
import { ArrowRight, Eye, MapPin, Pencil, Plus, Printer, X } from 'lucide-react'
import { AdminFilters, AdminListing, AdminListState, AdminPageHeader } from '../../components/admin/AdminUI'
import useAdminData from '../../components/admin/useAdminData'

const statuses = [
  ['', 'All Statuses'],
  ['pending', 'Pending'],
  ['confirmed', 'Confirmed'],
  ['out_for_delivery', 'Out for Delivery'],
  ['delivered', 'Delivered'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
]

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [actionError, setActionError] = useState(null)
  const [opening, setOpening] = useState(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)

  const status = searchParams.get('status') || ''

  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  const { data, loading, error, load } = useAdminData(`/orders/?${params}`, 250)
  const orders = data || []
  const active = [search && `Search: ${search}`, status && `Status: ${statuses.find(([value]) => value === status)?.[1] || status}`].filter(Boolean)
  const clear = () => { setSearch(''); setSearchParams({}) }

  const openDetail = async (o) => {
    setOpening(o.id); setActionError(null)
    try {
      const { data } = await api.get(`/orders/${o.id}/`)
      setDetail(data)
    } catch { setActionError({ text: 'Order details could not be loaded.', retry: () => openDetail(o) }) }
    finally { setOpening(null) }
  }

  const remove = async (o) => {
    if (!window.confirm(`Delete order for ${o.customer_name}?`)) return
    await api.delete(`/orders/${o.id}/`)
    setDetail(null)
    load()
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Orders & Delivery" description="Record deliveries — what items, how many, and where they go." action={<Button variant="conversion" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={18} aria-hidden="true" />New Order</Button>} />
      <AdminFilters search={search} onSearch={setSearch} searchLabel="Search orders" searchHint="Customer, address or contact number." active={active} onClear={clear}>
        <SelectField label="Order status" value={status} onChange={(e) => setSearchParams(e.target.value ? { status: e.target.value } : {})}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
      </AdminFilters>
      {actionError && <InlineAlert tone="error" action={<Button onClick={actionError.retry}>Try again</Button>}>{actionError.text}</InlineAlert>}
      {opening !== null && <p role="status">Loading order details…</p>}
      <AdminListState name="Orders" loading={loading} error={error} count={orders.length} filtered={active.length > 0} onRetry={load} onClear={clear}>
        <AdminListing name="Orders" records={orders} columns={[
          { key: 'customer', label: 'Customer', render: (o) => <>{o.customer_name}<span className="admin-secondary">{o.contact_number}</span></> },
          { key: 'event', label: 'Event', render: (o) => <>{o.event_type || '—'}<span className="admin-secondary">{o.event_date || ''}</span></> },
          { key: 'address', label: 'Address', render: (o) => <>{o.delivery_address}{o.lat && <span className="admin-secondary"><MapPin size={14} className="admin-inline-icon" aria-hidden="true" />Pinned on map</span>}</> },
          { key: 'items', label: 'Items', render: (o) => <>{o.items?.reduce((s, i) => s + Number(i.quantity), 0) || 0} pcs</> },
          { key: 'total', label: 'Total', render: (o) => formatPHP(o.total_price) },
          { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} label={o.status_display} /> },
        ]} actions={(o) => <><Button variant="secondary" aria-label={`View order ${o.id} for ${o.customer_name}`} disabled={opening !== null} onClick={() => openDetail(o)}><Eye size={16} aria-hidden="true" />View</Button><Button variant="ghost" aria-label={`Edit order ${o.id} for ${o.customer_name}`} onClick={() => { setEditing(o); setShowForm(true) }}><Pencil size={16} aria-hidden="true" />Edit</Button></>} />
      </AdminListState>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? 'Edit Order' : 'New Order'}>
          <OrderForm
            initial={editing}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); setDetail(null); load() }}
          />
        </Modal>
      )}

      {detail && (
        <OrderDetail order={detail} onClose={() => setDetail(null)} onChange={load} onDelete={remove} />
      )}
    </div>
  )
}

function OrderDetail({ order, onClose, onChange, onDelete }) {
  const [items, setItems] = useState(order.items || [])
  const [status, setStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setItems(order.items || [])
    setStatus(order.status)
  }, [order])

  const saveReturns = async () => {
    setSaving(true)
    try {
      const payload = { ...order, items, status }
      const { data } = await api.put(`/orders/${order.id}/`, payload)
      setItems(data.items)
      setStatus(data.status)
      onChange()
    } finally {
      setSaving(false)
    }
  }

  const setStatusAndSave = async (s) => {
    setStatus(s)
    setSaving(true)
    try {
      const { data } = await api.put(`/orders/${order.id}/`, { ...order, items, status: s })
      setItems(data.items)
      setStatus(data.status)
      onChange()
    } finally {
      setSaving(false)
    }
  }

  const print = () => {
    downloadOrderPdf({
      id: order.id,
      date: new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
      customer_name: order.customer_name,
      contact_number: order.contact_number,
      email: order.email,
      event_type: order.event_type,
      event_date: order.event_date,
      event_time: order.event_time,
      delivery_address: order.delivery_address,
      status: order.status,
      items,
      total_price: order.total_price,
      discount: order.discount,
      deposit: order.deposit,
      balance: order.balance,
    })
  }

  const nextStatus = {
    pending: 'confirmed',
    confirmed: 'out_for_delivery',
    out_for_delivery: 'delivered',
    delivered: 'completed',
  }

  return (
    <Modal onClose={onClose} title={`Order #${order.id} — ${order.customer_name}`} wide>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Customer" value={order.customer_name} />
          <Info label="Contact" value={order.contact_number} />
          <Info label="Email" value={order.email || '—'} />
          <Info label="Event" value={`${order.event_type || '—'} · ${order.event_date || 'no date'}`} />
          <Info label="Delivery Date" value={order.delivery_date || '—'} />
          <Info label="Delivered At" value={formatDateTime(order.delivered_at)} />
        </div>

        <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
          <p className="text-[11px] font-semibold tracking-wide text-navy-600 uppercase">Delivery Address</p>
          <p className="mt-1 text-sm font-medium text-navy-900">{order.delivery_address}</p>
          {order.lat && (
            <p className="mt-1 text-xs text-gold-600">
              <MapPin size={16} className="admin-inline-icon" aria-hidden="true" /> Pinned: {Number(order.lat).toFixed(5)}, {Number(order.lng).toFixed(5)}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-navy-600 uppercase">
            Items — Update returned quantities here
          </p>
          <div className="overflow-x-auto rounded-xl border border-navy-100">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="bg-navy-50/60 text-left text-[11px] tracking-wider text-navy-600 uppercase">
                  <th className="px-4 py-2.5">Item</th>
                  <th className="px-4 py-2.5">Dispatched</th>
                  <th className="px-4 py-2.5">Returned</th>
                  <th className="px-4 py-2.5">Missing</th>
                  <th className="px-4 py-2.5">Price</th>
                  <th className="px-4 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-t border-navy-50">
                    <td className="px-4 py-2.5 font-medium text-navy-900">
                      {it.item_name}{' '}
                      {it.is_custom && <StatusBadge status="manual" label="Custom" />}
                    </td>
                    <td className="px-4 py-2.5 text-navy-700">{it.quantity}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min={0}
                        max={it.quantity}
                        className="w-20 rounded-lg border border-navy-200 px-2 py-1.5 text-sm outline-none focus:border-gold-500"
                        value={it.quantity_returned}
                        onChange={(e) => {
                          const q = Math.min(Number(e.target.value) || 0, it.quantity)
                          setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, quantity_returned: q } : x)))
                        }}
                      />
                    </td>
                    <td className={`px-4 py-2.5 font-semibold ${it.quantity - it.quantity_returned > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {it.quantity - it.quantity_returned}
                    </td>
                    <td className="px-4 py-2.5 text-navy-700">{formatPHP(it.unit_price)}</td>
                    <td className="px-4 py-2.5 text-navy-500">{it.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-500/40 bg-gold-500/10 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-navy-600 uppercase">Status:</span>
            <StatusBadge status={status} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {nextStatus[status] && (
              <button
                className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
                disabled={saving}
                onClick={() => setStatusAndSave(nextStatus[status])}
              >
                <ArrowRight size={16} className="admin-inline-icon" aria-hidden="true" /> {nextStatus[status].replaceAll('_', ' ')}
              </button>
            )}
            <button
              className="rounded-full border border-navy-200 px-5 py-2 text-sm font-semibold text-navy-800 transition hover:border-navy-400 disabled:opacity-50"
              disabled={saving}
              onClick={saveReturns}
            >
              {saving ? 'Saving…' : 'Save Returns'}
            </button>
            <button
              className="rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
              onClick={print}
            >
              <Printer size={16} className="admin-inline-icon" aria-hidden="true" /> Print PDF
            </button>
          </div>
        </div>

        <div className="flex justify-between gap-3 border-t border-navy-100 pt-4">
          <button
            className="text-sm font-semibold text-red-500 transition hover:text-red-600"
            onClick={() => onDelete(order)}
          >
            Delete Order
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <p className="text-navy-600">
                Total: <span className="font-semibold text-navy-900">{formatPHP(order.total_price)}</span>
              </p>
              <p className="text-navy-600">
                Deposit: <span className="font-semibold text-navy-900">{formatPHP(order.deposit)}</span>
                {' · '}Balance:{' '}
                <span className="font-semibold text-gold-700">{formatPHP(order.balance)}</span>
              </p>
            </div>
            <button className={btnGhost} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wide text-navy-500 uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-navy-900">{value}</p>
    </div>
  )
}

function Modal({ children, title, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:p-8">
      <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} rounded-3xl bg-white shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-navy-100 bg-white/95 px-6 py-4 backdrop-blur">
          <h3 className="font-display text-lg font-bold text-navy-900">{title}</h3>
          <button onClick={onClose} className="text-navy-500 transition hover:text-navy-900" aria-label="Close">
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
