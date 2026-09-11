import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { storage } from '../lib/storage'

export default function Home() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState({ quotes: 0, packages: 0 })

  useEffect(() => {
    Promise.all([storage.getQuotes(), storage.getPackages()]).then(([quotes, packages]) =>
      setCounts({ quotes: quotes.length, packages: packages.length }),
    )
  }, [])

  const tiles = [
    {
      to: '/quote',
      icon: '➕',
      title: 'New Quotation',
      subtitle: 'Create a quote for a customer',
      primary: true,
    },
    {
      to: '/quotes',
      icon: '📁',
      title: 'Saved Quotations',
      subtitle: `${counts.quotes} saved`,
    },
    {
      to: '/packages',
      icon: '📦',
      title: 'Packages',
      subtitle: `${counts.packages} package${counts.packages === 1 ? '' : 's'} ready`,
    },
    {
      to: '/catalog',
      icon: '🪑',
      title: 'Items & Prices',
      subtitle: 'Edit party needs and rates',
    },
    {
      to: '/settings',
      icon: '⚙️',
      title: 'Settings',
      subtitle: 'Backup and restore',
    },
  ]

  return (
    <div className="safe-top min-h-screen bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 px-4 pb-8 pt-8">
      <div className="mx-auto flex max-w-lg flex-col items-center">
        <img
          src="/images/logo.jpg"
          alt="Jan & Jimels logo"
          className="h-24 w-24 rounded-full border-4 border-gold-500 object-cover shadow-xl shadow-gold-500/20"
        />
        <h1 className="mt-4 text-center text-2xl font-bold text-white">Jan &amp; Jimels</h1>
        <p className="text-sm tracking-[0.2em] text-gold-400 uppercase">Quotation App</p>

        <div className="mt-8 w-full space-y-3">
          {tiles.map((t) => (
            <button
              key={t.to}
              type="button"
              onClick={() => navigate(t.to)}
              className={`tap-target flex w-full items-center gap-4 rounded-3xl px-5 py-5 text-left shadow-xl transition active:scale-[0.99] ${
                t.primary
                  ? 'bg-gold-500 text-navy-950 shadow-gold-500/30'
                  : 'border border-white/10 bg-white/10 text-white backdrop-blur'
              }`}
            >
              <span className="text-3xl">{t.icon}</span>
              <span className="flex-1">
                <span className="block text-xl font-bold">{t.title}</span>
                <span className={`block text-sm ${t.primary ? 'text-navy-800/80' : 'text-white/60'}`}>
                  {t.subtitle}
                </span>
              </span>
              <span className="text-2xl opacity-60">›</span>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/50">
          Works offline — no internet needed. {counts.quotes} quotation
          {counts.quotes === 1 ? '' : 's'} saved on this phone.
        </p>
      </div>
    </div>
  )
}
