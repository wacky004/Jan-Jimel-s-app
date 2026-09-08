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

const HOME = [14.5758, 121.1182]
const DEFAULT_SHOP = { address: '#1 Pelota St., Saint Francis Village, Cainta, Rizal', lat: 14.5758, lng: 121.1182 }

const makePinIcon = (color, size = 20) =>
  L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.45)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  })

const makeHighlightIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#d4af37;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 0 0 3px rgba(212,175,55,.35),0 2px 8px rgba(0,0,0,.5)"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  })

const makeShopIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="width:34px;height:34px;border-radius:8px;background:#14274d;border:3px solid #d4af37;color:#f0d47a;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.5)">JJ</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })

export default function DeliveryMap() {
  const [pins, setPins] = useState([])
  const [shop, setShop] = useState(DEFAULT_SHOP)
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
  const [pinError, setPinError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [shopForm, setShopForm] = useState(null)
  const [shopSaving, setShopSaving] = useState(false)
  const [shopError, setShopError] = useState('')
  const [customer, setCustomer] = useState(null)
  const [customerPins, setCustomerPins] = useState([])
  const [destPinId, setDestPinId] = useState(null)
  const [routePath, setRoutePath] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeNote, setRouteNote] = useState('')
  const [routeLoading, setRouteLoading] = useState(false)
  const [noLocation, setNoLocation] = useState(false)
  const mapRef = useRef(null)
  const manualModeRef = useRef(false)
  const clickHandlerRef = useRef(() => {})
  const pinForCustomerRef = useRef(null)

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

  useEffect(() => {
    api
      .get('/orders/shop/')
      .then(({ data }) => {
        if (data && data.lat !== null && data.lng !== null) {
          setShop({ address: data.address || DEFAULT_SHOP.address, lat: data.lat, lng: data.lng })
        }
      })
      .catch(() => {})
  }, [])

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

  const fitRoute = (dest) => {
    if (mapRef.current) {
      mapRef.current.fitBounds(
        [
          [shop.lat, shop.lng],
          [dest.lat, dest.lng],
        ],
        { padding: [70, 70] },
      )
    }
  }

  const drawRoute = useCallback(
    async (dest) => {
      if (!dest) return
      setRouteLoading(true)
      setRouteNote('')
      try {
        const coords = `${shop.lng},${shop.lat};${dest.lng},${dest.lat}`
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
        )
        const data = await res.json()
        const route = data.routes?.[0]
        if (route?.geometry?.coordinates) {
          setRoutePath(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]))
          setRouteInfo({ km: route.distance / 1000, min: route.duration / 60 })
        } else {
          setRoutePath([
            [shop.lat, shop.lng],
            [dest.lat, dest.lng],
          ])
          setRouteInfo(null)
          setRouteNote('Road route unavailable — showing a straight line.')
        }
      } catch {
        setRoutePath([
          [shop.lat, shop.lng],
          [dest.lat, dest.lng],
        ])
        setRouteInfo(null)
        setRouteNote('Road route unavailable — showing a straight line.')
      } finally {
        setRouteLoading(false)
      }
    },
    [shop.lat, shop.lng],
  )

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

  const clearCustomer = () => {
    setCustomer(null)
    setCustomerPins([])
    setDestPinId(null)
    setRoutePath(null)
    setRouteInfo(null)
    setRouteNote('')
    setNoLocation(false)
    pinForCustomerRef.current = null
  }

  const selectCustomer = (c) => {
    setCustomer(c)
    setRoutePath(null)
    setRouteInfo(null)
    setRouteNote('')
    setNoLocation(false)
    setCustResults([])
    const matched = pins.filter(
      (p) => p.customer_name && p.customer_name.toLowerCase() === (c.name || '').toLowerCase(),
    )
    setCustomerPins(matched)

    let dest = null
    if (matched.length > 0) {
      const sorted = [...matched].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      dest = sorted[0]
      setDestPinId(`${sorted[0].source}-${sorted[0].id}`)
      if (matched.length === 1) fly(dest.lat, dest.lng)
      else mapRef.current?.fitBounds(matched.map((p) => [p.lat, p.lng]), { padding: [50, 50] })
    } else if (c.lat && c.lng) {
      dest = { lat: c.lat, lng: c.lng }
      setDestPinId(null)
      fly(c.lat, c.lng)
    } else if (c.address) {
      setNoLocation(true)
      return
    } else {
      setNoLocation(true)
      return
    }
    drawRoute(dest)
  }

  const pickDestination = (p) => {
    setDestPinId(`${p.source}-${p.id}`)
    fly(p.lat, p.lng)
    drawRoute({ lat: p.lat, lng: p.lng })
  }

  const currentDest = useMemo(() => {
    if (!customer) return null
    const match = customerPins.find((p) => `${p.source}-${p.id}` === destPinId)
    if (match) return { lat: match.lat, lng: match.lng }
    if (destPinId === null && customer.lat && customer.lng) return { lat: customer.lat, lng: customer.lng }
    return null
  }, [customer, customerPins, destPinId])

  const onMapClick = (lat, lng) => {
    if (!manualModeRef.current) return
    setManualMode(false)
    manualModeRef.current = false
    setPinError('')
    const forCustomer = pinForCustomerRef.current
    setPinForm({
      label: forCustomer ? forCustomer.name : '',
      address: '',
      lat,
      lng,
      pin_date: localDate(),
      notes: '',
    })
    reverseGeocode(lat, lng).then((address) => {
      if (address) setPinForm((f) => (f ? { ...f, address } : f))
    })
  }
  clickHandlerRef.current = onMapClick

  const openPinForm = (place, lat, lng) => {
    setPinError('')
    const forCustomer = pinForCustomerRef.current
    setPinForm({
      label: forCustomer ? forCustomer.name : '',
      address: place?.display_name || '',
      lat,
      lng,
      pin_date: localDate(),
      notes: '',
    })
    setAddrResults([])
    fly(lat, lng)
  }

  const savePin = async (e) => {
    e.preventDefault()
    setPinError('')
    if (!pinForm) return
    const label = pinForm.label.trim()
    if (!label && !pinForm.address.trim()) {
      setPinError('Enter a short label or at least an address.')
      return
    }
    setSaving(true)
    try {
      await api.post('/orders/pins/', { ...pinForm, label })
      setPinForm(null)
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 3500)
      const forCustomer = pinForCustomerRef.current
      pinForCustomerRef.current = null
      await load()
      if (forCustomer) {
        setCustQuery(forCustomer.name)
        const { data } = await api.get(`/orders/customers/?search=${encodeURIComponent(forCustomer.name)}`)
        const found = data.find((x) => x.name.toLowerCase() === forCustomer.name.toLowerCase()) || data[0]
        if (found) selectCustomer(found)
      }
    } catch (err) {
      const data = err.response?.data
      const msg =
        typeof data === 'string'
          ? data
          : Object.values(data || {})
              .flat()
              .join(' ') || 'Could not save the pin. Please try again.'
      setPinError(msg)
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

  const pinThisCustomer = () => {
    pinForCustomerRef.current = customer
    setNoLocation(false)
    setManualMode(true)
    manualModeRef.current = true
    if (customer?.address) {
      setAddrQuery(customer.address)
      searchAddress()
    }
  }

  const saveShop = async (e) => {
    e.preventDefault()
    setShopError('')
    if (!shopForm) return
    setShopSaving(true)
    try {
      const { data } = await api.put('/orders/shop/', shopForm)
      setShop({ address: data.address || DEFAULT_SHOP.address, lat: data.lat, lng: data.lng })
      setShopForm(null)
      if (currentDest) drawRoute(currentDest)
    } catch (err) {
      setShopError('Could not save the shop location. Please try again.')
    } finally {
      setShopSaving(false)
    }
  }

  const searchShopAddress = async () => {
    if (!shopForm?.address.trim()) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(shopForm.address)}`,
      )
      const data = await res.json()
      if (data[0]) {
        setShopForm((f) => ({ ...f, lat: Number(data[0].lat), lng: Number(data[0].lon) }))
      } else {
        setShopError('Address not found — type it differently or set the pin manually.')
      }
    } catch {
      setShopError('Address search failed. Check your connection.')
    }
  }

  const isCustomerPin = (p) =>
    customer &&
    p.customer_name &&
    p.customer_name.toLowerCase() === customer.name.toLowerCase()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-900">Delivery Map</h2>
          <p className="text-sm text-navy-600">
            Search a customer to pan to their location and see road directions from the shop.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative w-full max-w-xs">
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-600 uppercase">
              1. 🔎 Search customer
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
                    key={`${c.source}-${c.order_id || c.name}-${c.name}`}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="block w-full border-b border-navy-50 px-4 py-3 text-left transition last:border-0 hover:bg-gold-500/10"
                  >
                    <p className="text-sm font-semibold text-navy-900">{c.name}</p>
                    <p className="text-xs text-navy-600">
                      📞 {c.phone || '—'} {c.email && `· ✉ ${c.email}`}
                    </p>
                    <p className="text-xs text-navy-500">{c.address}</p>
                    <p className="mt-0.5 text-[11px] text-navy-400">
                      {c.pin_count} pinned location{c.pin_count === 1 ? '' : 's'} ·{' '}
                      {c.event_type && `${c.event_type} · `}last {formatDateTime(c.created_at)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full max-w-xs">
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-600 uppercase">
              2. 📌 Save a pin — search address
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

          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-600 uppercase">
              2b. or pin manually
            </p>
            <button
              type="button"
              onClick={() => {
                const next = !manualMode
                setManualMode(next)
                manualModeRef.current = next
                if (next) pinForCustomerRef.current = null
              }}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                manualMode
                  ? 'bg-gold-500 text-navy-950 shadow-lg'
                  : 'border border-navy-200 bg-white text-navy-800 hover:border-gold-500'
              }`}
            >
              {manualMode ? '✔ Manual pin ON — click the map' : '🖐 Manual pin'}
            </button>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-600 uppercase">
              🏠 Shop base
            </p>
            <button
              type="button"
              onClick={() => setShopForm({ address: shop.address, lat: shop.lat, lng: shop.lng })}
              className="rounded-full border border-navy-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-gold-500"
            >
              Set shop base
            </button>
          </div>

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

        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(statusColors).map(([v, c]) => (
            <span key={v} className="flex items-center gap-1.5 text-xs text-navy-600">
              <span className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: c }} />
              {v.replaceAll('_', ' ')} ({pins.filter((p) => p.status === v).length})
            </span>
          ))}
        </div>
      </div>

      <div className="relative h-[62vh] overflow-hidden rounded-3xl border border-navy-200 shadow-lg">
        <MapContainer center={HOME} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher handlerRef={clickHandlerRef} />
          {heat && <HeatLayer points={heatPoints} />}

          {/* Shop base */}
          <Marker position={[shop.lat, shop.lng]} icon={makeShopIcon()}>
            <Popup>
              <p className="font-semibold text-navy-900">Jan &amp; Jimels (Shop)</p>
              <p className="text-xs text-navy-600">{shop.address}</p>
            </Popup>
            <Tooltip direction="top" offset={[0, -20]}>Jan &amp; Jimels (Shop)</Tooltip>
          </Marker>

          {/* Destination marker */}
          {currentDest && routePath && (
            <Marker position={[currentDest.lat, currentDest.lng]} icon={makePinIcon('#2563eb', 26)}>
              <Popup>
                <p className="font-semibold text-navy-900">{customer.name}</p>
                <p className="text-xs text-navy-600">Destination</p>
              </Popup>
            </Marker>
          )}

          {/* Delivery pins */}
          {filtered.map(
            (p) =>
              p.lat && p.lng && (
                <Marker
                  key={`${p.source}-${p.id}`}
                  position={[p.lat, p.lng]}
                  icon={isCustomerPin(p) ? makeHighlightIcon() : makePinIcon(statusColors[p.status] || '#999')}
                  interactive={!manualMode}
                >
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

          {/* Route path */}
          {routePath && routePath.length > 1 && (
            <>
              <Polyline positions={routePath} color="#ffffff" weight={9} opacity={0.75} />
              <Polyline positions={routePath} color="#2563eb" weight={4.5} opacity={0.95} />
            </>
          )}
        </MapContainer>
        {loading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/60">
            <p className="text-sm font-medium text-navy-600">Loading pins…</p>
          </div>
        )}
      </div>

      {/* Customer panel */}
      {customer ? (
        <div className="rounded-2xl border border-gold-500/40 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-navy-900">{customer.name}</h3>
              <p className="text-sm text-navy-700">
                📞 {customer.phone || '—'}
                {customer.email && ` · ✉ ${customer.email}`}
              </p>
              <p className="mt-1 text-xs text-navy-500">{customer.address}</p>
              <p className="mt-1 text-xs text-navy-500">
                {customer.event_type && `${customer.event_type} · `}
                {customerPins.length > 0
                  ? `${customerPins.length} pinned location${customerPins.length > 1 ? 's' : ''}`
                  : 'no pinned location yet'}
                {customer.status && (
                  <span className="ml-2">
                    <StatusBadge status={customer.status} />
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {routeLoading && (
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  Getting route…
                </span>
              )}
              {!routeLoading && routeInfo && (
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                  ≈ {routeInfo.km.toFixed(1)} km · {Math.round(routeInfo.min)} min drive
                </span>
              )}
              {!routeLoading && currentDest && (
                <button
                  type="button"
                  onClick={() => drawRoute(currentDest)}
                  className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  {routePath ? '↻ Refresh directions' : '🧭 Show directions'}
                </button>
              )}
              {routePath && (
                <button
                  type="button"
                  onClick={() => {
                    setRoutePath(null)
                    setRouteInfo(null)
                    setRouteNote('')
                  }}
                  className="rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400"
                >
                  Clear path
                </button>
              )}
              <button
                type="button"
                onClick={clearCustomer}
                className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* multiple locations picker */}
          {customerPins.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-navy-600 uppercase">Locations:</span>
              {customerPins.map((p) => (
                <button
                  key={`${p.source}-${p.id}`}
                  type="button"
                  onClick={() => pickDestination(p)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    `${p.source}-${p.id}` === destPinId
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-navy-200 text-navy-700 hover:border-blue-400'
                  }`}
                >
                  {p.address ? p.address.slice(0, 40) : `${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)}`}
                  {p.event_date && ` · ${p.event_date}`}
                </button>
              ))}
            </div>
          )}

          {noLocation && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">
                This customer has no pinned location yet.
              </p>
              <button
                type="button"
                onClick={pinThisCustomer}
                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
              >
                📍 Pin this customer — click their location on the map
              </button>
            </div>
          )}

          {routeNote && <p className="mt-2 text-xs text-amber-700">{routeNote}</p>}
        </div>
      ) : (
        <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-navy-700">
            <span className="font-semibold">{filtered.length}</span> delivery{' '}
            {filtered.length === 1 ? 'location' : 'locations'}
            {month && ` in ${month}`}
            {status && ` (${status.replaceAll('_', ' ')})`}.
          </p>
          <p className="mt-1 text-xs text-navy-500">
            Search a customer to pan to their pin and automatically draw the road route from the
            shop. Save new pins by address search or manual click.
          </p>
        </div>
      )}

      {pinForm && (
        <PinFormModal
          pinForm={pinForm}
          setPinForm={setPinForm}
          saving={saving}
          error={pinError}
          onSave={savePin}
        />
      )}

      {shopForm && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:p-8">
          <form onSubmit={saveShop} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-navy-900">Shop Base (Home Address)</h3>
            <p className="text-xs text-navy-500">
              All customer directions start from this point.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Address</p>
                <textarea
                  rows={2}
                  className={input}
                  value={shopForm.address}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  placeholder="#1 Pelota St., Saint Francis Village, Cainta, Rizal"
                />
                <button
                  type="button"
                  onClick={searchShopAddress}
                  className="mt-2 rounded-full border border-navy-200 px-4 py-1.5 text-xs font-semibold text-navy-700 transition hover:border-gold-500"
                >
                  🔍 Find coordinates from address
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Latitude</p>
                  <input
                    type="number"
                    step="0.000001"
                    className={input}
                    value={shopForm.lat ?? ''}
                    onChange={(e) => setShopForm({ ...shopForm, lat: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">Longitude</p>
                  <input
                    type="number"
                    step="0.000001"
                    className={input}
                    value={shopForm.lng ?? ''}
                    onChange={(e) => setShopForm({ ...shopForm, lng: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {shopError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{shopError}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShopForm(null)} className="rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400">
                Cancel
              </button>
              <button type="submit" disabled={shopSaving || shopForm.lat === null || shopForm.lng === null} className={btnGold}>
                {shopSaving ? 'Saving…' : 'Save Shop Base'}
              </button>
            </div>
          </form>
        </div>
      )}

      {savedToast && (
        <div className="fixed right-6 bottom-6 z-[80] rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-xl">
          ✓ Pin saved!
        </div>
      )}
    </div>
  )
}

function ClickCatcher({ handlerRef }) {
  useMapEvents({
    click(e) {
      if (handlerRef.current) handlerRef.current(e.latlng.lat, e.latlng.lng)
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

function localDate() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function PinFormModal({ pinForm, setPinForm, saving, error, onSave }) {
  const set = (k) => (e) => setPinForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:p-8">
      <form onSubmit={onSave} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="font-display text-lg font-bold text-navy-900">Save Pin</h3>
        <p className="text-xs text-navy-500">
          {Number(pinForm.lat).toFixed(5)}, {Number(pinForm.lng).toFixed(5)}
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">
              Label (short name, optional)
            </p>
            <input
              className={input}
              maxLength={150}
              value={pinForm.label}
              onChange={set('label')}
              placeholder="e.g. Aling Maria's house"
            />
            <p className="mt-1 text-[11px] text-navy-400">
              Tip: use the customer's name so you can search and find them again later.
            </p>
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

        {error && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

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
