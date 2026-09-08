import { jsPDF } from 'jspdf'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../api'
import { btnGold, btnGhost, formatDateTime, formatPHP, input, StatusBadge } from '../../components/ui'
import OrderForm from './OrderForm'

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
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)

  const status = searchParams.get('status') || ''

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      const { data } = await api.get(`/orders/?${params}`)
      setOrders(data.results || data)
    } finally {
      setLoading(false)
    }
  }, [status, search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const openDetail = async (o) => {
    try {
      const { data } = await api.get(`/orders/${o.id}/`)
      setDetail(data)
    } catch {}
  }

  const remove = async (o) => {
    if (!window.confirm(`Delete order for ${o.customer_name}?`)) return
    await api.delete(`/orders/${o.id}/`)
    setDetail(null)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-900">Orders &amp; Delivery</h2>
          <p className="text-sm text-navy-600">
            Record deliveries — what items, how many, and where they go.
          </p>
        </div>
        <button className={btnGold} onClick={() => { setEditing(null); setShowForm(true) }}>
          + New Order
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className={`${input} max-w-xs`}
          placeholder="🔍 Search customer, address, number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${input} w-auto`}
          value={status}
          onChange={(e) => setSearchParams(e.target.value ? { status: e.target.value } : {})}
        >
          {statuses.map(([v, l]) => (
            <option key={v || 'all'} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60 text-[11px] tracking-wider text-navy-600 uppercase">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-navy-500">Loading orders…</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-navy-500">
                  No orders found. Click “+ New Order” to record your first delivery.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer border-b border-navy-50 transition last:border-0 hover:bg-gold-500/5"
                  onClick={() => openDetail(o)}
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-navy-900">{o.customer_name}</p>
                    <p className="text-xs text-navy-500">{o.contact_number}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-navy-800">{o.event_type || '—'}</p>
                    <p className="text-xs text-navy-500">{o.event_date || ''}</p>
                  </td>
                  <td className="max-w-[220px] px-4 py-3.5">
                    <p className="truncate text-navy-700" title={o.delivery_address}>
                      {o.delivery_address}
                    </p>
                    {o.lat && (
                      <p className="text-xs text-gold-600">📍 pinned on map</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-navy-700">
                    {o.items?.reduce((s, i) => s + Number(i.quantity), 0) || 0} pcs
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-navy-900">{formatPHP(o.total_price)}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={o.status} label={o.status_display} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-700 transition hover:border-gold-500 hover:text-gold-600"
                      onClick={(e) => { e.stopPropagation(); setEditing(o); setShowForm(true) }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Jan & Jimels Party Needs', 105, 18, { align: 'center' })
    doc.setFontSize(11)
    doc.text('Event Rentals & Supplies - Est. 1995', 105, 25, { align: 'center' })
    doc.text('#1 Pelota St., Saint Francis Village, Cainta, Rizal', 105, 31, { align: 'center' })
    doc.text('0908-950-3879 | 0999-760-3211 | janjimels95@gmail.com', 105, 37, { align: 'center' })

    doc.setFontSize(14)
    doc.text(`ORDER #${order.id}`, 14, 50)
    doc.setFontSize(10)
    doc.text(`Customer: ${order.customer_name}`, 14, 58)
    doc.text(`Contact: ${order.contact_number}${order.email ? ' | ' + order.email : ''}`, 14, 64)
    doc.text(`Event: ${order.event_type || '—'} on ${order.event_date || '—'} at ${order.event_time || '—'}`, 14, 70)
    doc.text(`Deliver to: ${order.delivery_address}`, 14, 76)
    doc.text(`Status: ${order.status.replaceAll('_', ' ').toUpperCase()}`, 14, 82)

    let y = 92
    doc.text('ITEMS', 14, y)
    y += 6
    items.forEach((i) => {
      doc.text(`${i.item_name} x${i.quantity} @ ${formatPHP(i.unit_price)} = ${formatPHP(i.quantity * i.unit_price)}`, 18, y)
      y += 6
    })
    y += 4
    doc.text(`Subtotal: ${formatPHP(order.total_price)}`, 14, y)
    y += 6
    doc.text(`Deposit: ${formatPHP(order.deposit)}   Balance: ${formatPHP(order.balance)}`, 14, y)
    doc.save(`Order-${order.id}-${order.customer_name.replace(/\s+/g, '-')}.pdf`)
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
              📍 Pinned: {Number(order.lat).toFixed(5)}, {Number(order.lng).toFixed(5)}
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
                → {nextStatus[status].replaceAll('_', ' ')}
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
              🖨 Print PDF
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
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
