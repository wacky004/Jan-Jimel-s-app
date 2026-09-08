import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src="/images/logo.jpg" alt="logo" className="h-14 w-14 rounded-full border-2 border-gold-500 object-cover" />
            <div>
              <p className="font-display text-lg font-bold">Jan &amp; Jimels</p>
              <p className="text-[11px] tracking-[0.18em] text-gold-400 uppercase">Party Needs</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/70">
            Event Rentals &amp; Supplies — serving celebrations with quality equipment and
            reliable delivery since 1995.
          </p>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-gold-400">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li><Link className="hover:text-gold-400" to="/">Home</Link></li>
            <li><Link className="hover:text-gold-400" to="/#about">About Us</Link></li>
            <li><Link className="hover:text-gold-400" to="/#services">Services</Link></li>
            <li><Link className="hover:text-gold-400" to="/#gallery">Gallery</Link></li>
            <li><Link className="hover:text-gold-400" to="/quote">Request a Quote</Link></li>
            <li><Link className="hover:text-gold-400" to="/admin/login">Admin Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-gold-400">Services</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>Weddings &amp; Debuts</li>
            <li>Birthdays &amp; Christenings</li>
            <li>Corporate Events</li>
            <li>Sound System &amp; Lights</li>
            <li>Tents &amp; Canopies</li>
            <li>Tables, Chairs &amp; Linens</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-gold-400">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>#1 Pelota St., Saint Francis Village, Cainta, Rizal</li>
            <li>
              <a className="hover:text-gold-400" href="tel:09089503879">0908-950-3879</a>
            </li>
            <li>
              <a className="hover:text-gold-400" href="tel:09997603211">0999-760-3211</a>
            </li>
            <li>
              <a className="hover:text-gold-400" href="mailto:janjimels95@gmail.com">
                janjimels95@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Jan &amp; Jimels Party Needs · Est. 1995 · All rights reserved
      </div>
    </footer>
  )
}
