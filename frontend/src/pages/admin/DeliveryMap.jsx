import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import api from '../../api'
import { btnGold, formatDateTime, formatPHP, input, StatusBadge } from '../../components/ui'

const statusColors = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  out_for_delivery: '#a855f7',
  delivered: '#22c55e',
  completed: '#14274d',
  cancelled: '#ef4444',
  manual: '#111827',
}

const makePinIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;background:${color};border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.45)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  })

const makeNumberIcon = (num) =>
  L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50%;background:#14274d;border:3px solid #d4af37;color:#f0d47a;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.4)">${num}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })

const HOME = [14.5758, 121.1182]

export default function DeliveryMap() {
  const [tab, setTab] = useState('pins')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-900">Delivery Map</h2>
          <p className="text-sm text-navy-600">
            Pin deliveries and plan the day's route.
          </p>
        </div>
        <div className="flex rounded-full border border-navy-200 bg-white p-1 shadow-sm">
          <TabButton active={tab === 'pins'} onClick={() => setTab('pins')}>
            📍 Delivery Pins
          </TabButton>
          <TabButton active={tab === 'routes'} onClick={() => setTab('routes')}>
            🚚 Route Planner
          </TabButton>
        </div>
      </div>

      {tab === 'pins' ? <PinsTab /> : <RoutesTab />}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
        active ? 'bg-navy-900 text-white shadow' : 'text-navy-600 hover:text-navy-900'
      }`}
    >
      {children}
    </button>
  )
}

/* ============================ TAB 1: PINS ============================ */

function PinsTab() {
  const [pins, setPins] = useState([])
  const [status, setStatus] = useState('')
  const [month, setMonth] = useState('')
  const [heat, setHeat] = useState(false)
  const [loading, setLoading] = useState(true)
  const [manualMode, setManualMode] = useState(false)
  const [addrQuery, setAddrQuery] = useState('')
  const [addrResults, setAddrResults] = useState([])
  const [custQuery, setCustQuery] = useState('')
  const [custResults, setCustResults] = useState([])
  const [pinForm, setPinForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const mapRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      const { data } = await api.get(`/orders/pins/?${params}`)
      setPins(data)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (!month) return pins
    const [y, m] = month.split('-')
    return pins.filter((p) => {
      const d = new Date(p.delivered_at || p.event_date || p.created_at)
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
      const d = new Date(p.delivered_at || p.event_date || p.created_at)
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    })
    return [...set].sort().reverse()
  }, [pins])

  const fly = (lat, lng) => {
    if (mapRef.current) mapRef.current.flyTo([lat, lng], 15, { duration: 1 })
  }

  const searchAddress = async () => {
    if (!addrQuery.trim()) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(addrQuery)}`,
      )
      setAddrResults(await res.json())
    } catch {
      setAddrResults([])
    }
  }

  const searchCustomer = async (q) => {
    setCustQuery(q)
    if (!q.trim()) return setCustResults([])
    try {
      const { data } = await api.get(`/orders/customers/?search=${encodeURIComponent(q)}`)
      setCustResults(data)
    } catch {
      setCustResults([])
    }
  }

  const onMapClick = (lat, lng) => {
    if (!manualMode) return
    reverseGeocode(lat, lng).then((address) => {
      setPinForm({ label: '', address, lat, lng, pin_date: new Date().toISOString().slice(0, 10), notes: '' })
      setManualMode(false)
    })
  }

  const openPinForm = (place, lat, lng) => {
    setPinForm({
      label: place?.display_name || '',
      address: place?.display_name || '',
      lat,
      lng,
      pin_date: new Date().toISOString().slice(0, 10),
      notes: '',
    })
    setAddrResults([])
    fly(lat, lng)
  }

  const savePin = async (e) => {
    e.preventDefault()
    if (!pinForm.label.trim()) return
    setSaving(true)
    try {
      await api.post('/orders/pins/', pinForm)
      setPinForm(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const deletePin = async (id) => {
    if (!window.confirm('Delete this manual pin?')) return
    try {
      await api.delete(`/orders/pins/${id}/`)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete pin.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full max-w-xs">
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-600 uppercase">
            🔎 Search existing customer
          </p>
          <input
            className={input}
            placeholder="Type customer name…"
            value={custQuery}
            onChange={(e) => searchCustomer(e.target.value)}
          />
          {custResults.length > 0 && (
            <div className="absolute z-[600] mt-1 max-h-72 w-full max-w-xs overflow-y-auto rounded-xl border border-navy-100 bg-white shadow-xl">
              {custResults.map((c) => (
                <button
                  key={`${c.order_id}-${c.name}`}
                  type="button"
                  onClick={() => {
                    if (c.lat && c.lng) {
                      fly(c.lat, c.lng)
                      setCustResults([])
                    } else {
                      searchAddrFor(c)
                      setCustResults([])
                    }
                  }}
                  className="block w-full border-b border-navy-50 px-4 py-3 text-left transition last:border-0 hover:bg-gold-500/10"
                >
                  <p className="text-sm font-semibold text-navy-900">{c.name}</p>
                  <p className="text-xs text-navy-600">
                    📞 {c.phone || '—'} {c.email && `· ✉ ${c.email}`}
                  </p>
                  <p className="text-xs text-navy-500">{c.address}</p>
                  <p className="mt-0.5 text-[11px] text-navy-400">
                    {c.event_type && `${c.event_type} · `}last order {formatDateTime(c.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-full max-w-xs">
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-600 uppercase">
            📌 Search address to pin
          </p>
          <div className="flex gap-2">
            <input
              className={input}
              placeholder="Street, barangay, city…"
              value={addrQuery}
              onChange={(e) => setAddrQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchAddress())}
            />
            <button
              type="button"
              onClick={searchAddress}
              className="shrink-0 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-700"
            >
              Search
            </button>
          </div>
          {addrResults.length > 0 && (
            <div className="absolute z-[600] mt-1 max-h-72 w-full max-w-xs overflow-y-auto rounded-xl border border-navy-100 bg-white shadow-xl">
              {addrResults.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  onClick={() => openPinForm(r, Number(r.lat), Number(r.lon))}
                  className="block w-full border-b border-navy-50 px-4 py-2.5 text-left text-xs text-navy-800 transition last:border-0 hover:bg-gold-500/10"
                >
                  📍 {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            manualMode
              ? 'bg-gold-500 text-navy-950 shadow-lg'
              : 'border border-navy-200 bg-white text-navy-800 hover:border-gold-500'
          }`}
        >
          {manualMode ? '✔ Manual pin ON — click the map' : '🖐 Manual pin'}
        </button>

        <select className={`${input} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.keys(statusColors).map((v) => (
            <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>
          ))}
        </select>

        <select className={`${input} w-auto`} value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-800">
          <input type="checkbox" className="h-4 w-4 accent-red-500" checked={heat} onChange={(e) => setHeat(e.target.checked)} />
          Heatmap
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(statusColors).map(([v, c]) => (
          <span key={v} className="flex items-center gap-1.5 text-xs text-navy-600">
            <span className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: c }} />
            {v.replaceAll('_', ' ')} ({pins.filter((p) => p.status === v).length})
          </span>
        ))}
      </div>

      <div className="relative h-[65vh] overflow-hidden rounded-3xl border border-navy-200 shadow-lg">
        <MapContainer center={HOME} zoom={12} style={{ height: '100%', width: '100%' }} ref={mapRef}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher onPick={onMapClick} />
          {heat && <HeatLayer points={heatPoints} />}
          {filtered.map(
            (p) =>
              p.lat && p.lng && (
                <Marker key={`${p.source}-${p.id}`} position={[p.lat, p.lng]} icon={makePinIcon(statusColors[p.status] || '#999')}>
                  <Popup>
                    <div className="min-w-[230px]">
                      <p className="font-semibold text-navy-900">{p.customer_name}</p>
                      {p.source === 'order' ? (
                        <>
                          <p className="mt-1 text-xs text-navy-600">{p.address}</p>
                          <p className="mt-1 text-xs text-navy-700">
                            📞 {p.contact_number || '—'}
                            {p.email && ` · ✉ ${p.email}`}
                          </p>
                          {p.event_type && (
                            <p className="text-xs text-navy-600">
                              🎉 {p.event_type}
                              {p.event_date && ` · ${p.event_date}`} · {formatPHP(p.total_price)}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <StatusBadge status={p.status} />
                            <span className="text-xs text-navy-500">{formatDateTime(p.delivered_at || p.created_at)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="mt-1 text-xs text-navy-600">{p.address || 'No address'}</p>
                          {p.event_date && <p className="text-xs text-navy-600">📅 {p.event_date}</p>}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <StatusBadge status="manual" label="Manual Pin" />
                            <button
                              type="button"
                              onClick={() => deletePin(p.id)}
                              className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-500 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
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
          Order pins come from saved orders. Manual pins are saved here or in the Route Planner.
        </p>
      </div>

      {pinForm && (
        <PinFormModal
          pinForm={pinForm}
          setPinForm={setPinForm}
          saving={saving}
          onSave={savePin}
        />
      )}
    </div>
  )

  async function searchAddrFor(c) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(c.address)}`,
      )
      const data = await res.json()
      if (data[0]) fly(Number(data[0].lat), Number(data[0].lon))
    } catch {}
  }
}

function ClickCatcher({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
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

function reverseGeocode(lat, lng) {
  return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    .then((r) => r.json())
    .then((d) => d.display_name || '')
    .catch(() => '')
}

function PinFormModal({ pinForm, setPinForm, saving, onSave }) {
  const set = (k) => (e) => setPinForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:p-8">
      <form onSubmit={onSave} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="font-display text-lg font-bold text-navy-900">Save Manual Pin</h3>
        <p className="text-xs text-navy-500">
          {Number(pinForm.lat).toFixed(5)}, {Number(pinForm.lng).toFixed(5)}
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Label *</p>
            <input className={input} value={pinForm.label} onChange={set('label')} placeholder="e.g. Aling Maria's house" required />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Address</p>
            <textarea rows={2} className={input} value={pinForm.address} onChange={set('address')} />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Date</p>
            <input type="date" className={input} value={pinForm.pin_date} onChange={set('pin_date')} />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Notes</p>
            <input className={input} value={pinForm.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setPinForm(null)} className="rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400">
            Cancel
          </button>
          <button type="submit" disabled={saving} className={btnGold}>
            {saving ? 'Saving…' : 'Save Pin'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ========================= TAB 2: ROUTE PLANNER ========================= */

function RoutesTab() {
  const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10))
  const [routeName, setRouteName] = useState('')
  const [routeId, setRouteId] = useState(null)
  const [stops, setStops] = useState([])
  const [routes, setRoutes] = useState([])
  const [pathLine, setPathLine] = useState([])
  const [clickMode, setClickMode] = useState(false)
  const [addrQuery, setAddrQuery] = useState('')
  const [addrResults, setAddrResults] = useState([])
  const [custQuery, setCustQuery] = useState('')
  const [custResults, setCustResults] = useState([])
  const [stopForm, setStopForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const mapRef = useRef(null)

  const loadRoutes = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/routes/?date=${routeDate}`)
      setRoutes(data.results || data)
    } catch {
      setRoutes([])
    }
  }, [routeDate])

  useEffect(() => {
    loadRoutes()
  }, [loadRoutes])

  const clearAll = () => {
    setStops([])
    setPathLine([])
    setRouteId(null)
    setRouteName('')
  }

  const loadRoute = (r) => {
    setRouteId(r.id)
    setRouteName(r.name || '')
    setStops(r.stops || [])
  }

  const fly = (lat, lng) => {
    if (mapRef.current) mapRef.current.flyTo([lat, lng], 15, { duration: 1 })
  }

  const addStop = (s) => {
    setStops((arr) => [...arr, { name: s.name || '', phone: s.phone || '', address: s.address || '', lat: s.lat, lng: s.lng, notes: s.notes || '' }])
  }

  const updateStop = (idx, k, v) =>
    setStops((arr) => arr.map((s, i) => (i === idx ? { ...s, [k]: v } : s)))

  const moveStop = (idx, dir) =>
    setStops((arr) => {
      const next = [...arr]
      const j = idx + dir
      if (j < 0 || j >= next.length) return arr
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })

  const removeStop = (idx) => setStops((arr) => arr.filter((_, i) => i !== idx))

  // Draw route following real roads (OSRM), fallback straight lines
  useEffect(() => {
    if (stops.length < 2) return setPathLine([])
    const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';')
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
        )
        const data = await res.json()
        if (cancelled) return
        if (data.routes?.[0]?.geometry?.coordinates) {
          setPathLine(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]))
        } else {
          setPathLine(stops.map((s) => [s.lat, s.lng]))
        }
      } catch {
        if (!cancelled) setPathLine(stops.map((s) => [s.lat, s.lng]))
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [stops])

  const searchAddress = async () => {
    if (!addrQuery.trim()) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(addrQuery)}`,
      )
      setAddrResults(await res.json())
    } catch {
      setAddrResults([])
    }
  }

  const searchCustomer = async (q) => {
    setCustQuery(q)
    if (!q.trim()) return setCustResults([])
    try {
      const { data } = await api.get(`/orders/customers/?search=${encodeURIComponent(q)}`)
      setCustResults(data)
    } catch {
      setCustResults([])
    }
  }

  const onMapClick = (lat, lng) => {
    if (!clickMode) return
    reverseGeocode(lat, lng).then((address) => {
      setStopForm({ name: '', phone: '', address, lat, lng })
    })
  }

  const saveRoute = async () => {
    if (stops.length === 0) return alert('Add at least one stop.')
    setSaving(true)
    try {
      const payload = {
        route_date: routeDate,
        name: routeName || `Route for ${routeDate}`,
        stops: stops.map((s) => ({ ...s, seq: undefined })),
      }
      if (routeId) await api.put(`/orders/routes/${routeId}/`, payload)
      else await api.post('/orders/routes/', payload)
      clearAll()
      loadRoutes()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not save route.')
    } finally {
      setSaving(false)
    }
  }

  const deleteRoute = async (r) => {
    if (!window.confirm(`Delete route "${r.name || r.route_date}"?`)) return
    try {
      await api.delete(`/orders/routes/${r.id}/`)
      loadRoutes()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete route.')
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {/* Controls + stops panel */}
      <div className="space-y-4 xl:col-span-1">
        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wide text-navy-600 uppercase">Delivery date</p>
          <input type="date" className={`${input} mt-1`} value={routeDate} onChange={(e) => { setRouteDate(e.target.value); clearAll() }} />
          <p className="mt-3 text-[11px] font-semibold tracking-wide text-navy-600 uppercase">Route name</p>
          <input className={`${input} mt-1`} placeholder="e.g. Morning deliveries" value={routeName} onChange={(e) => setRouteName(e.target.value)} />
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => setClickMode(!clickMode)}
              className={`w-full rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                clickMode ? 'bg-gold-500 text-navy-950' : 'border border-navy-200 text-navy-800 hover:border-gold-500'
              }`}
            >
              {clickMode ? '✔ Click map to add stop' : '🖐 Manually pin a stop'}
            </button>
            <button type="button" onClick={saveRoute} disabled={saving} className={`${btnGold} w-full`}>
              {saving ? 'Saving…' : '💾 Save Route'}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="w-full rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wide text-navy-600 uppercase">🔎 Existing customer</p>
          <input
            className={`${input} mt-1`}
            placeholder="Type customer name…"
            value={custQuery}
            onChange={(e) => searchCustomer(e.target.value)}
          />
          {custResults.length > 0 && (
            <div className="mt-1 max-h-64 overflow-y-auto rounded-xl border border-navy-100 bg-white shadow-xl">
              {custResults.map((c) => (
                <div key={`${c.order_id}-${c.name}`} className="border-b border-navy-50 p-3 last:border-0">
                  <p className="text-sm font-semibold text-navy-900">{c.name}</p>
                  <p className="text-xs text-navy-600">
                    📞 {c.phone || '—'} {c.email && `· ✉ ${c.email}`}
                  </p>
                  <p className="text-xs text-navy-500">{c.address}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (c.lat && c.lng) {
                        addStop({ name: c.name, phone: c.phone, address: c.address, lat: c.lat, lng: c.lng })
                        fly(c.lat, c.lng)
                      } else {
                        setStopForm({ name: c.name, phone: c.phone, address: c.address, lat: null, lng: null })
                        setClickMode(true)
                      }
                      setCustResults([])
                    }}
                    className="mt-2 rounded-full bg-navy-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-700"
                  >
                    + Add to route
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wide text-navy-600 uppercase">📍 Search address</p>
          <div className="mt-1 flex gap-2">
            <input
              className={input}
              placeholder="Street, barangay…"
              value={addrQuery}
              onChange={(e) => setAddrQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchAddress())}
            />
            <button type="button" onClick={searchAddress} className="shrink-0 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-700">
              Go
            </button>
          </div>
          {addrResults.length > 0 && (
            <div className="mt-1 max-h-64 overflow-y-auto rounded-xl border border-navy-100 bg-white shadow-xl">
              {addrResults.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  onClick={() => {
                    const lat = Number(r.lat)
                    const lng = Number(r.lon)
                    addStop({ name: '', phone: '', address: r.display_name, lat, lng })
                    fly(lat, lng)
                    setAddrResults([])
                  }}
                  className="block w-full border-b border-navy-50 px-3 py-2.5 text-left text-xs text-navy-800 transition last:border-0 hover:bg-gold-500/10"
                >
                  📍 {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wide text-navy-600 uppercase">
            Saved routes on {routeDate}
          </p>
          {routes.length === 0 ? (
            <p className="mt-2 text-xs text-navy-500">No routes saved for this date yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {routes.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-navy-100 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900">{r.name || r.route_date}</p>
                    <p className="text-xs text-navy-500">{r.stops?.length || 0} stops</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => loadRoute(r)} className="rounded-lg border border-navy-200 px-2.5 py-1 text-[11px] font-semibold text-navy-700 transition hover:border-gold-500 hover:text-gold-600">
                      Load
                    </button>
                    <button type="button" onClick={() => deleteRoute(r)} className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-500 transition hover:bg-red-50">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map + stop list */}
      <div className="space-y-4 xl:col-span-3">
        <div className="h-[58vh] overflow-hidden rounded-3xl border border-navy-200 shadow-lg">
          <MapContainer center={HOME} zoom={12} style={{ height: '100%', width: '100%' }} ref={mapRef}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickCatcher onPick={onMapClick} />
            {stops.map((s, i) => (
              <Marker key={i} position={[s.lat, s.lng]} icon={makeNumberIcon(i + 1)}>
                <Popup>
                  <div className="min-w-[200px]">
                    <p className="font-semibold text-navy-900">Stop {i + 1}: {s.name || 'Unnamed'}</p>
                    {s.phone && <p className="text-xs text-navy-600">📞 {s.phone}</p>}
                    <p className="mt-1 text-xs text-navy-600">{s.address}</p>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -15]}>
                  {i + 1}. {s.name || 'Unnamed stop'}
                </Tooltip>
              </Marker>
            ))}
            {pathLine.length > 1 && <Polyline positions={pathLine} color="#d4af37" weight={5} opacity={0.9} />}
          </MapContainer>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-navy-900">
              Stops ({stops.length})
            </h3>
            <p className="text-xs text-navy-500">Road path follows real streets (OSRM).</p>
          </div>
          {stops.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-navy-200 bg-navy-50/50 px-4 py-6 text-center text-sm text-navy-500">
              Add stops using search, an existing customer, or by clicking the map.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {stops.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-navy-100 bg-navy-50/40 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 font-bold text-gold-400">
                    {i + 1}
                  </span>
                  <div className="grid flex-1 gap-2 sm:grid-cols-3">
                    <input className={input} placeholder="Customer name" value={s.name} onChange={(e) => updateStop(i, 'name', e.target.value)} />
                    <input className={input} placeholder="Phone" value={s.phone} onChange={(e) => updateStop(i, 'phone', e.target.value)} />
                    <input className={input} placeholder="Address" value={s.address} onChange={(e) => updateStop(i, 'address', e.target.value)} />
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button type="button" onClick={() => moveStop(i, -1)} disabled={i === 0} className="h-6 w-6 rounded border border-navy-200 text-xs font-bold text-navy-600 transition hover:border-gold-500 disabled:opacity-30">▲</button>
                    <button type="button" onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1} className="h-6 w-6 rounded border border-navy-200 text-xs font-bold text-navy-600 transition hover:border-gold-500 disabled:opacity-30">▼</button>
                  </div>
                  <button type="button" onClick={() => removeStop(i)} className="shrink-0 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-50">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stopForm && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (stopForm.lat === null) return
              addStop(stopForm)
              setStopForm(null)
              setClickMode(false)
            }}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h3 className="font-display text-lg font-bold text-navy-900">New Stop</h3>
            <p className="text-xs text-navy-500">
              {stopForm.lat !== null
                ? `${Number(stopForm.lat).toFixed(5)}, ${Number(stopForm.lng).toFixed(5)}`
                : 'Click on the map to set the exact location.'}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Customer / Stop name</p>
                <input className={input} value={stopForm.name} onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })} placeholder="e.g. Maria Santos" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Phone</p>
                <input className={input} value={stopForm.phone} onChange={(e) => setStopForm({ ...stopForm, phone: e.target.value })} placeholder="09XX-XXX-XXXX" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Address</p>
                <textarea rows={2} className={input} value={stopForm.address} onChange={(e) => setStopForm({ ...stopForm, address: e.target.value })} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => { setStopForm(null); setClickMode(false) }} className="rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400">
                Cancel
              </button>
              <button type="submit" disabled={stopForm.lat === null} className={btnGold}>
                Add Stop
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
