import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/#about', label: 'About' },
  { to: '/#services', label: 'Services' },
  { to: '/#gallery', label: 'Gallery' },
  { to: '/#equipment', label: 'Rates' },
  { to: '/#contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isLanding = location.pathname === '/'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || !isLanding ? 'bg-navy-950/95 shadow-lg shadow-navy-950/30 backdrop-blur' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/images/logo.jpg"
            alt="Jan & Jimels Party Needs logo"
            className="h-12 w-12 rounded-full border-2 border-gold-500 object-cover"
          />
          <div className="leading-tight">
            <p className="font-display text-lg font-bold text-white">Jan &amp; Jimels</p>
            <p className="text-[11px] font-medium tracking-[0.18em] text-gold-400 uppercase">
              Party Needs
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-sm font-medium text-white/90 transition hover:text-gold-400"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/quote"
            className="rounded-full bg-gold-500 px-5 py-2 text-sm font-semibold text-navy-950 shadow-lg shadow-gold-500/30 transition hover:bg-gold-400"
          >
            Request a Quote
          </Link>
        </nav>

        <button
          className="text-white md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="space-y-1 bg-navy-950/95 px-6 pb-5 md:hidden">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-white/90"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/quote"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-full bg-gold-500 px-5 py-2 text-center text-sm font-semibold text-navy-950"
          >
            Request a Quote
          </Link>
        </nav>
      )}
    </header>
  )
}
