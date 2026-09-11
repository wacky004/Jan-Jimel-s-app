import { useEffect, useState } from 'react'

import PackageBuilder from '../components/PackageBuilder'
import { BigButton, EmptyState, TopBar } from '../components/ui'
import { formatPHPShort } from '../lib/format'
import { storage } from '../lib/storage'

export default function Packages() {
  const [packages, setPackages] = useState([])
  const [catalog, setCatalog] = useState([])
  const [builder, setBuilder] = useState(null) // null | 'new' | package object
  const [loaded, setLoaded] = useState(false)

  const load = () =>
    Promise.all([storage.getPackages(), storage.getCatalog()]).then(([p, c]) => {
      setPackages(p)
      setCatalog(c)
      setLoaded(true)
    })

  useEffect(() => {
    load()
  }, [])

  const savePackage = async (pkg) => {
    const next = await storage.upsertPackage(pkg)
    setPackages(next)
    setBuilder(null)
  }

  const remove = async (pkg) => {
    if (!window.confirm(`Delete package "${pkg.name}"?`)) return
    const next = await storage.deletePackage(pkg.id)
    setPackages(next)
  }

  return (
    <div className="safe-top min-h-screen bg-navy-50">
      <TopBar title="Packages" onBack={() => window.history.back()} />
      <div className="safe-bottom mx-auto max-w-lg space-y-4 px-4 py-5">
        <p className="text-sm text-navy-500">
          Equipment packages are priced as one bundle. Build a package by picking items and setting one price.
        </p>

        {loaded && packages.length === 0 && (
          <EmptyState icon="📦" title="No packages yet" subtitle="Build your first package below." />
        )}

        <div className="space-y-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-3xl border-2 border-navy-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-navy-900">{pkg.name}</p>
                  <p className="text-sm font-semibold text-gold-600">{formatPHPShort(pkg.price)}</p>
                  {pkg.items?.length > 0 && (
                    <p className="mt-1 text-xs leading-snug text-navy-500">
                      {pkg.items.map((i) => `${i.qty} ${i.name}`).join(' · ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(pkg)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-red-100 text-lg text-red-500 active:bg-red-50"
                  aria-label="Delete package"
                >
                  🗑
                </button>
              </div>
              <button
                type="button"
                onClick={() => setBuilder(pkg)}
                className="tap-target mt-3 w-full rounded-2xl border-2 border-navy-100 text-base font-bold text-navy-800 active:bg-navy-50"
              >
                ✏️ Edit Package
              </button>
            </div>
          ))}
        </div>

        <BigButton onClick={() => setBuilder('new')}>➕ Build a Package</BigButton>
      </div>

      {builder && (
        <PackageBuilder
          initial={builder === 'new' ? null : builder}
          catalog={catalog}
          onSave={savePackage}
          onClose={() => setBuilder(null)}
        />
      )}
    </div>
  )
}
