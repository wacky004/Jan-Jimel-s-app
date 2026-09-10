import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Truck, MapPin, Wallet, AlertTriangle, Package, Download } from 'lucide-react'
import api from '../../api'
import { Button, EmptyState, ErrorState, formatPHP, InlineAlert, LoadingSkeleton } from '../../components/ui'
import { AdminPageHeader } from '../../components/admin/AdminUI'
import useAdminData from '../../components/admin/useAdminData'

export default function Dashboard() {
  const { data: stats, loading, error, load } = useAdminData('/orders/dashboard/')
  const cards = [
    { label: 'Pending Orders', value: stats?.orders_pending, to: '/admin/orders?status=pending', icon: Clock },
    { label: 'Out for Delivery', value: stats?.orders_out_for_delivery, to: '/admin/orders?status=out_for_delivery', icon: Truck },
    { label: 'Deliveries This Month', value: stats?.deliveries_this_month, to: '/admin/map', icon: MapPin },
    { label: 'Total Revenue', value: formatPHP(stats?.revenue), to: '/admin/orders', icon: Wallet },
    { label: 'Low Stock Items', value: stats?.low_stock_count, to: '/admin/inventory?low_stock=true', icon: AlertTriangle },
    { label: 'Items in Inventory', value: stats?.items_total, to: '/admin/inventory', icon: Package },
  ]
  const empty = stats && [stats.orders_pending, stats.orders_out_for_delivery, stats.deliveries_this_month, stats.revenue, stats.low_stock_count, stats.items_total].every((value) => Number(value || 0) === 0)
  return <div className="space-y-6">
    <AdminPageHeader title="Dashboard" description="Overview of your orders, deliveries and inventory." />
    <section aria-label="Business overview">{loading ? <LoadingSkeleton label="Loading dashboard" lines={6} /> : error ? <ErrorState title="Dashboard could not be loaded" onRetry={load}>Try again to see the latest overview.</ErrorState> : <>
      {empty && <EmptyState title="No activity in this overview yet">Record orders and inventory to populate these metrics.</EmptyState>}
      <div className="admin-metrics">{cards.map(({ label, value, to, icon: Icon }) => <Link key={label} to={to} className="admin-metric"><Icon size={24} aria-hidden="true" /><div><strong>{value ?? '—'}</strong><span>{label}</span></div></Link>)}</div>
    </>}</section>
    <section className="admin-dashboard-section"><h2>Quick actions</h2><div className="admin-quick-links"><Link to="/admin/orders">Take a new order</Link><Link to="/admin/quotations">Inquiries &amp; quotations</Link></div></section>
    <section className="admin-dashboard-section"><h2>Export reports</h2><p>Download CSV files for record keeping.</p><div className="admin-export"><ExportBtn url="/api/orders/export/orders.csv" label="Orders CSV" /><ExportBtn url="/api/orders/export/inventory.csv" label="Inventory CSV" /></div></section>
  </div>
}

function ExportBtn({ url, label }) {
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const download = async () => {
    setBusy(true); setFeedback(null)
    try {
      const res = await api.get(url, { responseType: 'blob' })
      const href = URL.createObjectURL(res.data)
      try {
        const a = document.createElement('a')
        a.href = href
        a.download = url.split('/').pop()
        a.click()
      } finally { URL.revokeObjectURL(href) }
      setFeedback({ tone: 'success', text: `${label} is ready. Check your browser downloads.` })
    } catch {
      setFeedback({ tone: 'error', text: `${label} could not be downloaded. Try the download again.` })
    } finally { setBusy(false) }
  }
  return <div><Button variant="secondary" onClick={download} busy={busy} busyLabel={`Downloading ${label}…`}><Download size={18} aria-hidden="true" />{label}</Button>{feedback && <InlineAlert tone={feedback.tone}>{feedback.text}</InlineAlert>}</div>
}
