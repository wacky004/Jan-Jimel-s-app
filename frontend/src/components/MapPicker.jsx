import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const goldIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#d4af37;border:3px solid #14274d;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
})

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function MapPicker({ lat, lng, onPick, height = 300 }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const mapRef = useRef(null)

  const center = lat && lng ? [lat, lng] : [14.5758, 121.1182]

  useEffect(() => {
    if (mapRef.current && lat && lng) {
      mapRef.current.flyTo([lat, lng], 15, { duration: 1 })
    }
  }, [lat, lng])

  const search = async () => {
    if (!query.trim()) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
      )
      const data = await res.json()
      setResults(data)
    } catch {
      setResults([])
    }
  }

  const chooseResult = (r) => {
    const la = Number(r.lat)
    const ln = Number(r.lon)
    onPick(la, ln)
    if (mapRef.current) mapRef.current.flyTo([la, ln], 16, { duration: 1 })
    setResults([])
  }

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <input
          className="w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder-navy-300 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
          placeholder="Search address (e.g. Cainta, Rizal)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
        />
        <button
          type="button"
          onClick={search}
          className="shrink-0 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-700"
        >
          Search
        </button>
      </div>

      {results.length > 0 && (
        <div className="mb-2 overflow-hidden rounded-xl border border-navy-100 shadow-sm">
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => chooseResult(r)}
              className="block w-full border-b border-navy-50 bg-white px-3.5 py-2.5 text-left text-sm text-navy-800 transition last:border-0 hover:bg-gold-500/10"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      <div style={{ height }} className="overflow-hidden rounded-xl border border-navy-200">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onPick} />
          {lat && lng && <Marker position={[lat, lng]} icon={goldIcon} />}
        </MapContainer>
      </div>
      <p className="mt-1.5 text-xs text-navy-500">
        Click anywhere on the map to pin the delivery location. {lat && lng ? `Pinned: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : 'No pin set yet.'}
      </p>
    </div>
  )
}

export { icon, goldIcon }
