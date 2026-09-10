import { Armchair, Building2, Cake, CalendarDays, Check, Gem, Mail, MapPin, MessageSquare, Phone, Tent, Volume2 } from 'lucide-react'
import Hero3D from '../Hero3D'
import QuoteLink from './QuoteLink'

export function Hero() {
  return <section id="home" tabIndex={-1} className="public-hero" aria-labelledby="hero-heading">
    <div className="public-shell public-hero-grid">
      <div className="public-hero-copy"><p className="public-eyebrow">Jan &amp; Jimels Party Needs · Est. 1995</p><h1 id="hero-heading">Bring everyone<br /><em>together.</em></h1><p>Event rentals for your next celebration. Find chairs, tables, linens and more from Jan &amp; Jimels in Cainta, Rizal.</p><div className="public-actions"><QuoteLink /></div><div className="public-secondary-actions"><a href="tel:09089503879"><Phone size={18} aria-hidden="true" />Call us</a><a href="sms:09089503879"><MessageSquare size={18} aria-hidden="true" />Send a text</a></div></div>
      <Hero3D />
    </div>
  </section>
}

export function ServiceProof() {
  return <section className="public-proof" aria-label="About our business"><div className="public-shell public-proof-grid">
    <div><CalendarDays size={24} aria-hidden="true" /><p><strong>Established in 1995</strong><span>Event rentals &amp; supplies</span></p></div>
    <div><MapPin size={24} aria-hidden="true" /><p><strong>Based in Cainta, Rizal</strong><span>Visit us on Pelota Street</span></p></div>
    <div><Armchair size={24} aria-hidden="true" /><p><strong>From seating to tableware</strong><span>Build a list for your event</span></p></div>
  </div></section>
}

export function BookingSteps() {
  const steps = [
    ['Share your plans', 'Tell us the date, venue and items you have in mind. Add your phone number or email so we can contact you.'],
    ['Review your quotation', 'Check the equipment, quantities and pricing with our team. Ask about anything else your event needs.'],
    ['Confirm the details', 'Coordinate availability, payment and delivery arrangements with our team before your event.'],
  ]
  return <section className="public-section" aria-labelledby="booking-heading"><div className="public-shell"><div className="public-section-heading"><p className="public-eyebrow">How booking works</p><h2 id="booking-heading">Your plans, one step at a time.</h2></div><ol className="public-booking-grid">{steps.map(([title, description], i) => <li key={title}><span className="public-step-number">0{i + 1}</span><h3>{title}</h3><p>{description}</p></li>)}</ol><p className="public-booking-note"><Check size={18} aria-hidden="true" />A quotation request starts the conversation. It does not confirm a booking.</p></div></section>
}

export function Services() {
  const services = [
    [Gem, 'Weddings & debuts', 'Plan the seating, table settings and décor for your celebration.'],
    [Cake, 'Birthdays & christenings', 'Choose tables, chairs and linens to suit your gathering.'],
    [Building2, 'Corporate events', 'Discuss the equipment you need for your company function.'],
    [Volume2, 'Sound & lights', 'Ask about sound systems and lighting for your program.'],
    [Tent, 'Tents & canopies', 'Share your venue and setup requirements with our team.'],
    [Armchair, 'Tables, chairs & linens', 'Explore seating, table covers, sashes and tableware.'],
  ]
  return <section id="services" tabIndex={-1} className="public-section public-soft" aria-labelledby="services-heading"><div className="public-shell"><div className="public-section-heading"><p className="public-eyebrow">For the occasion</p><h2 id="services-heading">Make room for your kind of celebration.</h2></div><div className="public-services-grid">{services.map(([Icon, title, description]) => <article key={title}><Icon size={28} strokeWidth={1.75} aria-hidden="true" /><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>
}

export function BusinessHistory() {
  return <section id="about" tabIndex={-1} className="public-section public-history" aria-labelledby="about-heading"><div className="public-shell public-history-grid"><div><p className="public-eyebrow">Our story</p><h2 id="about-heading">Part of the celebration<br />since 1995.</h2><p>Jan &amp; Jimels Party Needs is an event-rental business based in Cainta, Rizal. Our collection includes chairs, tables, linens, tents, décor, glassware, sound equipment and lights.</p><p>From a family gathering to a company event, start with your date, venue and equipment list. We’ll discuss the details with you.</p><QuoteLink /></div><figure><img src="/images/cover logo.jpg" width="1942" height="809" alt="Jan & Jimels Party Needs business banner featuring its logo and event setup photographs" loading="lazy" /><figcaption>Jan &amp; Jimels Party Needs · Cainta, Rizal</figcaption></figure></div></section>
}

export function Contact() {
  return <section id="contact" tabIndex={-1} className="public-section" aria-labelledby="contact-heading"><div className="public-shell public-contact-grid"><div><p className="public-eyebrow">Let’s talk</p><h2 id="contact-heading">Tell us what you’re planning.</h2><p>Have a date in mind or an equipment question? Send your details through our quotation form, call or text us.</p><ul className="public-contact-list">
    <li><MapPin size={24} aria-hidden="true" /><div><h3>Visit us</h3><address>No. 01 Pelota St., New St. Francis Village,<br />San Juan, Cainta, Rizal</address></div></li>
    <li><Phone size={24} aria-hidden="true" /><div><h3>Call or text</h3><a href="tel:09089503879">0908-950-3879</a><a href="tel:09997603211">0999-760-3211</a><a href="sms:09089503879">Send a text message</a></div></li>
    <li><Mail size={24} aria-hidden="true" /><div><h3>Email us</h3><a href="mailto:janjimels95@gmail.com">janjimels95@gmail.com</a></div></li>
    </ul></div><div className="public-map"><iframe title="Jan & Jimels Party Needs location" src="https://www.openstreetmap.org/export/embed.html?bbox=121.1016%2C14.5652%2C121.1348%2C14.5864&layer=mapnik&marker=14.5758%2C121.1182" loading="lazy" /><a href="https://www.openstreetmap.org/?mlat=14.5758&mlon=121.1182#map=17/14.5758/121.1182" target="_blank" rel="noopener noreferrer">Open location on OpenStreetMap (new tab)</a></div></div></section>
}

export function FinalQuoteCTA() {
  return <section className="public-final-cta" aria-labelledby="final-quote-heading"><div className="public-shell"><p className="public-eyebrow">The next gathering starts here</p><h2 id="final-quote-heading">Let’s bring your plans to the table.</h2><p>Share your event date, venue and rental list.</p><QuoteLink /></div></section>
}
