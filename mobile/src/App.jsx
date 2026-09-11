import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { storage } from './lib/storage'
import Catalog from './pages/Catalog'
import Home from './pages/Home'
import NewQuote from './pages/NewQuote'
import Packages from './pages/Packages'
import Quotes from './pages/Quotes'
import Settings from './pages/Settings'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    storage.init().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-50">
        <p className="text-lg font-semibold text-navy-600">Loading…</p>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quote" element={<NewQuote />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
