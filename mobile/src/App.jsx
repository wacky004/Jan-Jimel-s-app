import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { BigButton, Modal } from './components/ui'
import { runPageBackHandler } from './lib/backButton'
import { storage } from './lib/storage'
import Catalog from './pages/Catalog'
import Home from './pages/Home'
import NewQuote from './pages/NewQuote'
import Packages from './pages/Packages'
import Quotes from './pages/Quotes'
import Settings from './pages/Settings'

function BackHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const [exitConfirm, setExitConfirm] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const handle = CapApp.addListener('backButton', () => {
      // A page (e.g. New Quotation) may handle the back gesture itself
      if (runPageBackHandler()) return
      if (location.pathname !== '/') {
        navigate('/')
        return
      }
      setExitConfirm(true)
    })
    return () => {
      handle.then((h) => h.remove())
    }
  }, [navigate, location.pathname])

  if (!exitConfirm) return null

  return (
    <Modal
      title="Exit JJ Quotation?"
      onClose={() => setExitConfirm(false)}
      footer={
        <div className="space-y-2">
          <BigButton variant="outline" onClick={() => setExitConfirm(false)}>
            Cancel
          </BigButton>
          <BigButton variant="danger" onClick={() => CapApp.exitApp()}>
            Exit App
          </BigButton>
        </div>
      }
    >
      <p className="text-base text-navy-700">Are you sure you want to close the app?</p>
    </Modal>
  )
}

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
      <BackHandler />
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
