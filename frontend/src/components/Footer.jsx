import { Link } from 'react-router-dom'
import { publicLinks } from './public/navigation'
import QuoteLink from './public/QuoteLink'
import './public/public.css'

export default function Footer() {
  return <footer className="public-footer">
    <div className="public-shell public-footer-grid">
      <div>
        <Link to="/" className="public-brand" aria-label="Jan & Jimels Party Needs — Home"><img src="/images/logo.jpg" alt="" width="48" height="48" /><span><strong>Jan &amp; Jimels</strong><small>Party Needs</small></span></Link>
        <p>Event rentals &amp; supplies<br />Est. 1995 · Cainta, Rizal</p>
        <QuoteLink />
      </div>
      <nav aria-label="Footer navigation"><h2>Explore</h2>{publicLinks.map(({ to, label }) => <Link key={to} to={to}>{label}</Link>)}<Link to="/#services">Services &amp; event types</Link></nav>
      <div><h2>Let’s plan your event</h2><address>No. 01 Pelota St., New St. Francis Village,<br />San Juan, Cainta, Rizal</address><a href="tel:09089503879">0908-950-3879</a><a href="tel:09997603211">0999-760-3211</a><a href="mailto:janjimels95@gmail.com">janjimels95@gmail.com</a></div>
    </div>
    <div className="public-shell public-footer-bottom"><p>© {new Date().getFullYear()} Jan &amp; Jimels Party Needs. All rights reserved.</p><Link to="/admin/login">Admin Login</Link></div>
  </footer>
}
