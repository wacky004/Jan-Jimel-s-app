import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import api from '../../api'
import { formatDateTime, StatusBadge } from '../../components/ui'

const statusColors = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  out_for_delivery: '#a855f7',
  delivered: '#22c55e',
  completed: '#14274d',
  cancelled: '#ef4444',
}

const makeIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;background:${color};border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.45)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  })

export default function DeliveryMap() {
  const [pins, setPins] = useState([])
  const [status, setStatus] = useState('')
  const [month, setMonth] = useState('')
  const [heat, setHeat] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    api
      .get(`/orders/pins/?${params}`)
      .then(({ data }) => setPins(data))
      .catch(() => setPins([]))
      .finally(() => setLoading(false))
  }, [status])

  const filtered = useMemo(() => {
    if (!month) return pins
    const [y, m] = month.split('-')
    return pins.filter((p) => {
      const d = new Date(p.delivered_at || p.created_at)
      return d.getFullYear() === Number(y) && d.getMonth() + 1 === Number(m)
    })
  }, [pins, month])

  const heatPoints = useMemo(
    () => filtered.filter((p) => p.lat && p.lng).map((p) => [p.lat, p.lng, 0.6]),
    [filtered],
  )

  const months = useMemo(() => {
    const set = new Set()
    pins.forEach((p) => {
      const d = new Date(p.delivered_at || p.created_at)
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    })
    return [...set].sort().reverse()
  }, [pins])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-900">Delivery Map</h2>
          <p className="text-sm text-navy-600">
            Every pinned delivery — see which areas you've served in the past.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-gold-500"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {Object.keys(statusColors).map((v) => (
              <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>
            ))}
          </select>
          <select
            className="rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-gold-500"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-800">
            <input
              type="checkbox"
              className="h-4 w-4 accent-red-500"
              checked={heat}
              onChange={(e) => setHeat(e.target.checked)}
            />
            Heatmap
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(statusColors).map(([v, c]) => (
          <span key={v} className="flex items-center gap-1.5 text-xs text-navy-600">
            <span className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: c }} />
            {v.replaceAll('_', ' ')} ({pins.filter((p) => p.status === v).length})
          </span>
        ))}
      </div>

      <div className="relative h-[68vh] overflow-hidden rounded-3xl border border-navy-200 shadow-lg">
        <MapContainer center={[14.5758, 121.1182]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {heat && <HeatLayer points={heatPoints} />}
          {filtered.map(
            (p) =>
              p.lat && p.lng && (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={makeIcon(statusColors[p.status] || '#999')}>
                  <Popup>
                    <div className="min-w-[220px]">
                      <p className="font-semibold text-navy-900">{p.customer_name}</p>
                      <p className="mt-1 text-xs text-navy-600">{p.address}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        <span className="text-xs text-navy-500">
                          {formatDateTime(p.delivered_at || p.created_at)}
                        </span>
                      </div>
                    </div>
                  </Popup>
                  <Tooltip direction="top" offset={[0, -18]}>
                    {p.customer_name}
                  </Tooltip>
                </Marker>
              ),
          )}
        </MapContainer>
        {loading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/60">
            <p className="text-sm font-medium text-navy-600">Loading pins…</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-navy-700">
          <span className="font-semibold">{filtered.length}</span> delivery{' '}
          {filtered.length === 1 ? 'location' : 'locations'}
          {month && ` in ${month}`}
          {status && ` (${status.replaceAll('_', ' ')})`}.
        </p>
        <p className="mt-1 text-xs text-navy-500">
          Pins are added automatically when you save an order with a location in the Orders page.
        </p>
      </div>
    </div>
  )
}

function HeatLayer({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!map || points.length === 0) return
    const layer = L.heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 15,
      gradient: { 0.2: '#14274d', 0.4: '#3b82f6', 0.6: '#f59e0b', 0.8: '#ef4444' },
    })
    layer.addTo(map)
    return () => map.removeLayer(layer)
  }, [map, points])
  return null
}
