import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Drawer, IconButton } from './ui'
import QuoteLink from './public/QuoteLink'
import { publicLinks } from './public/navigation'
import './public/public.css'

export default function Navbar() {
  const location = useLocation()
  const [menuKey, setMenuKey] = useState(null)
  const brand = useRef(null)
  const firstLink = useRef(null)
  const open = menuKey === location.key

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1200px)')
    let frame
    const closeAtDesktop = () => {
      if (!media.matches) return
      const wasOpen = document.getElementById('public-mobile-menu')?.open
      setMenuKey(null)
      if (wasOpen) frame = requestAnimationFrame(() => brand.current?.focus())
    }
    media.addEventListener('change', closeAtDesktop)
    return () => { media.removeEventListener('change', closeAtDesktop); cancelAnimationFrame(frame) }
  }, [])

  useEffect(() => {
    // Run after modal cleanup and route focus, including cross-page hash links.
    const frame = requestAnimationFrame(() => {
      if (location.pathname !== '/') return
      if (!location.hash) {
        document.getElementById('main-content')?.focus({ preventScroll: true })
        window.scrollTo({ top: 0, behavior: 'instant' })
        return
      }
      let id
      try { id = decodeURIComponent(location.hash.slice(1)) } catch { return }
      const target = document.getElementById(id)
      if (target) { target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start', behavior: 'instant' }) }
    })
    return () => cancelAnimationFrame(frame)
  }, [location.key, location.pathname, location.hash])

  const current = (to) => `${location.pathname}${location.hash}` === to ? 'page' : undefined
  return <header className="public-navbar">
    <div className="public-shell public-navbar-inner">
      <Link ref={brand} to="/" className="public-brand" aria-label="Jan & Jimels Party Needs — Home">
        <img src="/images/logo.jpg" alt="" width="48" height="48" />
        <span><strong>Jan &amp; Jimels</strong><small>Party Needs</small></span>
      </Link>
      <nav className="public-desktop-nav" aria-label="Main navigation">
        {publicLinks.map(({ to, label }) => <Link key={to} to={to} aria-current={current(to)}>{label}</Link>)}
        <QuoteLink />
      </nav>
      <IconButton className="public-menu-toggle" label="Open navigation" aria-expanded={open} aria-controls="public-mobile-menu" onClick={() => setMenuKey(location.key)}><Menu size={24} aria-hidden="true" /></IconButton>
    </div>
    <Drawer id="public-mobile-menu" open={open} onClose={() => setMenuKey(null)} title="Explore Jan & Jimels" description="Rentals, celebrations and contact details." initialFocusRef={firstLink} closeLabel="Close navigation" className="public-menu">
      <nav aria-label="Mobile navigation">
        {publicLinks.map(({ to, label }, index) => <Link ref={index === 0 ? firstLink : undefined} key={to} to={to} aria-current={current(to)} onClick={() => setMenuKey(null)}>{label}</Link>)}
        <QuoteLink onClick={() => setMenuKey(null)} />
      </nav>
      <a className="public-text-link" href="tel:09089503879">Call 0908-950-3879</a>
    </Drawer>
  </header>
}
