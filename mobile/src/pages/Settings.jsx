import { useRef, useState } from 'react'

import { BigButton, TopBar } from '../components/ui'
import { todayISO } from '../lib/format'
import { shareFile } from '../lib/share'
import { storage } from '../lib/storage'

export default function Settings() {
  const fileRef = useRef(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const backup = async () => {
    setError('')
    try {
      const data = await storage.exportAll()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      await shareFile({
        blob,
        filename: `JJ-Quotation-Backup-${todayISO()}.json`,
        mimeType: 'application/json',
        title: 'Quotation App Backup',
        text: 'Backup of Jan & Jimels quotation data',
      })
      setMessage('Backup created — save it to Files or send it to yourself.')
    } catch (e) {
      setError(`Backup failed: ${e.message || e}`)
    }
  }

  const restore = async (event) => {
    setError('')
    setMessage('')
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await storage.importAll(data)
      setMessage('Backup restored successfully. Restarting…')
      setTimeout(() => window.location.reload(), 900)
    } catch (e) {
      setError(`Restore failed: ${e.message || e}`)
    } finally {
      event.target.value = ''
    }
  }

  const reset = async () => {
    if (!window.confirm('Reset everything? All quotations, packages and price edits on this phone will be deleted.')) return
    await storage.resetAll()
    setMessage('App reset to the starting catalog.')
  }

  return (
    <div className="safe-top min-h-screen bg-navy-50">
      <TopBar title="Settings" onBack={() => window.history.back()} />
      <div className="safe-bottom mx-auto max-w-lg space-y-4 px-4 py-5">
        <div className="rounded-3xl border-2 border-navy-100 bg-white p-4">
          <h2 className="text-lg font-bold text-navy-900">💾 Backup</h2>
          <p className="mt-1 mb-3 text-sm text-navy-500">
            Save all quotations, packages and prices to a file. Keep it safe — this is your offline backup.
          </p>
          <BigButton onClick={backup}>Create Backup File</BigButton>
        </div>

        <div className="rounded-3xl border-2 border-navy-100 bg-white p-4">
          <h2 className="text-lg font-bold text-navy-900">📥 Restore</h2>
          <p className="mt-1 mb-3 text-sm text-navy-500">
            Restore from a backup file (e.g. on a new phone).
          </p>
          <BigButton variant="outline" onClick={() => fileRef.current?.click()}>
            Choose Backup File
          </BigButton>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={restore} />
        </div>

        <div className="rounded-3xl border-2 border-red-100 bg-white p-4">
          <h2 className="text-lg font-bold text-red-600">↺ Reset App</h2>
          <p className="mt-1 mb-3 text-sm text-navy-500">
            Deletes everything on this phone and restores the starting catalog.
          </p>
          <BigButton variant="danger" onClick={reset}>
            Reset Everything
          </BigButton>
        </div>

        {message && (
          <p className="rounded-2xl border-2 border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            ✓ {message}
          </p>
        )}
        {error && (
          <p className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="rounded-3xl border-2 border-navy-100 bg-white p-4 text-sm text-navy-500">
          <p className="font-bold text-navy-800">Jan &amp; Jimels Party Needs — Quotation App</p>
          <p className="mt-1">Works offline. No internet needed.</p>
          <p className="mt-1">0908-950-3879 · 0999-760-3211</p>
          <p className="mt-1">janjimels95@gmail.com</p>
        </div>
      </div>
    </div>
  )
}
