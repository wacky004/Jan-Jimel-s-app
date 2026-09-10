import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0v-6h4v6' },
  { to: '/admin/orders', label: 'Orders & Delivery', icon: 'M16 3h5v5M8 8l8-8M3 21h5v-5M16 16l8 8M21 16h-5v5M8 8l-5 5M3 3h5v5' },
  { to: '/admin/inventory', label: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/admin/map', label: 'Delivery Map', icon: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { to: '/admin/quotations', label: 'Quotations', icon: 'M9 12h6m-6 4h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z' },
  { to: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', superOnly: true },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const doLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const visibleNav = navItems.filter((i) => !i.superOnly || user?.role === 'super_admin')

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <img
          src="/images/logo.jpg"
          alt="logo"
          className="h-11 w-11 rounded-full border-2 border-gold-500 object-cover"
        />
        <div>
          <p className="font-display text-base font-bold text-white">Jan &amp; Jimels</p>
          <p className="text-[10px] tracking-[0.2em] text-gold-400 uppercase">Admin Portal</p>
        </div>
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-gold-500/15 text-gold-400'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/20 text-xs font-bold text-gold-400">
            {(user?.first_name?.[0] || user?.username?.[0] || 'A').toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.full_name || user?.username}
            </p>
            <p className="text-[10px] tracking-wide text-gold-400/90 uppercase">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </p>
          </div>
          <button
            onClick={doLogout}
            title="Logout"
            className="text-white/60 transition hover:text-red-400"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-navy-50/50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-navy-950 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-navy-950">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-navy-100 bg-white/90 px-5 py-3 backdrop-blur">
          <button className="text-navy-800 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-display truncate text-lg font-bold text-navy-900">
            Jan &amp; Jimels Party Needs
          </h1>
          <span className="ml-auto hidden text-xs text-navy-500 sm:block">
            Est. 1995 · Cainta, Rizal
          </span>
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 p-5 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
