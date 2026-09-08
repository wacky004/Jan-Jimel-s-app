import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { formatPHP } from '../../components/ui'

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/orders/dashboard/').then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const cards = [
    {
      label: 'Pending Orders',
      value: stats?.orders_pending,
      to: '/admin/orders?status=pending',
      color: 'from-amber-400 to-amber-500',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Out for Delivery',
      value: stats?.orders_out_for_delivery,
      to: '/admin/orders?status=out_for_delivery',
      color: 'from-purple-400 to-purple-600',
      icon: 'M16 3h5v5M8 8l8-8M3 21h5v-5M16 16l8 8M21 16h-5v5M8 8l-5 5M3 3h5v5',
    },
    {
      label: 'Deliveries This Month',
      value: stats?.deliveries_this_month,
      to: '/admin/map',
      color: 'from-green-400 to-green-600',
      icon: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      label: 'Total Revenue',
      value: formatPHP(stats?.revenue),
      to: '/admin/orders',
      color: 'from-gold-400 to-gold-600',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Low Stock Items',
      value: stats?.low_stock_count,
      to: '/admin/inventory?low_stock=true',
      color: 'from-red-400 to-red-600',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    {
      label: 'Items in Inventory',
      value: stats?.items_total,
      to: '/admin/inventory',
      color: 'from-navy-400 to-navy-600',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy-900">Dashboard</h2>
        <p className="text-sm text-navy-600">Overview of your orders, deliveries and inventory.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="group flex items-center gap-4 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span
              className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-lg`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={c.icon} />
              </svg>
            </span>
            <div>
              <p className="font-display text-2xl font-bold text-navy-900">
                {c.value ?? '…'}
              </p>
              <p className="text-xs font-medium tracking-wide text-navy-500 uppercase">{c.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Link
          to="/admin/orders"
          className="rounded-2xl border border-navy-100 bg-gradient-to-br from-navy-900 to-navy-700 p-6 text-white shadow-lg transition hover:shadow-xl"
        >
          <h3 className="font-display text-lg font-bold">Take a New Order</h3>
          <p className="mt-1 text-sm text-white/70">
            Record customer, items, quantities and delivery location — no more pen and paper.
          </p>
        </Link>
        <Link
          to="/admin/quotations"
          className="rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/90 to-gold-600/90 p-6 text-navy-950 shadow-lg transition hover:shadow-xl"
        >
          <h3 className="font-display text-lg font-bold">Inquiries &amp; Quotations</h3>
          <p className="mt-1 text-sm text-navy-950/75">
            Respond to customer quote requests coming from the website.
          </p>
        </Link>
      </div>

      <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-navy-900">Export Reports</h3>
            <p className="text-sm text-navy-600">Download CSV files for record keeping.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ExportBtn url="/api/orders/export/orders.csv" label="Orders CSV" />
            <ExportBtn url="/api/orders/export/inventory.csv" label="Inventory CSV" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ExportBtn({ url, label }) {
  const [busy, setBusy] = useState(false)
  const download = async () => {
    setBusy(true)
    try {
      const res = await api.get(url, { responseType: 'blob' })
      const href = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = href
      a.download = url.split('/').pop()
      a.click()
      URL.revokeObjectURL(href)
    } finally {
      setBusy(false)
    }
  }
  return (
    <button
      onClick={download}
      disabled={busy}
      className="rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-gold-500 hover:text-gold-600 disabled:opacity-50"
    >
      {busy ? 'Downloading…' : `⬇ ${label}`}
    </button>
  )
}
