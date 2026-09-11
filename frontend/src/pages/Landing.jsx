import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Hero3D from '../components/Hero3D'

const EQUIPMENT_GROUPS = [
  ['chairs', 'Chairs'],
  ['tables', 'Tables'],
  ['linens', 'Linen & Décor'],
  ['tents', 'Tent'],
  ['glassware', 'Equipment'],
]

const gallery = [
  '118991207_969595646799415_6140996894831890068_n.jpg',
  '119507536_974973656261614_5605340908193473247_n.jpg',
  '119560072_974973499594963_66919201614516531_n.jpg',
  '119632290_974973586261621_6129615637602960176_n.jpg',
  '478234547_1060512236094409_5694409156155540507_n.jpg',
  '480445256_1066078118871154_7382013258637400173_n.jpg',
  '480483674_1066078068871159_6741384027087861584_n.jpg',
  '480503876_1066078128871153_5075517710706458478_n.jpg',
  '480528325_1066077858871180_5011085625210133750_n.jpg',
  '480586199_1066078138871152_2727808754987400924_n.jpg',
  '480627628_1066077862204513_7211389075398162939_n.jpg',
  '480641475_1066078152204484_5388069941594122754_n.jpg',
  '480642031_1066078198871146_4977302815674747915_n.jpg',
  '480643194_1066078178871148_314470824798747233_n.jpg',
  '480676908_1066078122204487_6628025753464513618_n.jpg',
  '480680431_1066078062204493_1502142144216375540_n.jpg',
  '480685703_1066077865537846_785094030882485101_n.jpg',
  '480694697_1066078142204485_6712001793538788935_n.jpg',
  '480709260_1066078108871155_4613203331543894433_n.jpg',
  '480907470_1066077822204517_1233784821227918688_n.jpg',
].map((f) => `/images/${f}`)

const iconProps = {
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'h-7 w-7',
}

const services = [
  {
    icon: (
      <svg {...iconProps}>
        <path d="M6 3h12l4 6-10 13L2 9z" />
        <path d="M11 3 8 9l4 13 4-13-3-6" />
        <path d="M2 9h20" />
      </svg>
    ),
    title: 'Weddings & Debuts',
    desc: 'Elegant setups — Tiffany chairs, gold chiavari sets, round tables with luxurious linens and full styling.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
        <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
        <path d="M2 21h20" />
        <path d="M7 8v3M12 8v3M17 8v3" />
        <path d="M7 4h.01M12 4h.01M17 4h.01" />
      </svg>
    ),
    title: 'Birthdays & Christenings',
    desc: 'Fun and colorful themes complete with tables, chairs, décor and everything in between.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M12 6h.01" />
        <path d="M12 10h.01M12 14h.01" />
        <path d="M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
      </svg>
    ),
    title: 'Corporate Events',
    desc: 'Professional arrangements, sound systems and presentation-ready setups for your company functions.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    ),
    title: 'Sound System & Lights',
    desc: 'PA systems, projectors, party lights — keep your program running and the crowd entertained.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M3.5 21 14 3l10.5 18" />
        <path d="M9.5 21h11" />
        <path d="M12 12l-4.5 9" />
        <path d="M12 12l4.5 9" />
      </svg>
    ),
    title: 'Tents & Canopies',
    desc: 'Outdoor events covered. 10x10ft to 20x20ft canopies for any venue, any weather.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0z" />
        <path d="M5 18v2M19 18v2" />
      </svg>
    ),
    title: 'Tables, Chairs & Linens',
    desc: '500+ monobloc chairs, banquet and tiffany chairs, table cloths, covers and sashes in many colors.',
  },
]

const whyUs = [
  {
    title: 'Reliable Delivery',
    desc: 'We deliver on time, set up, and pick up — wherever your event is.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 7h8M8 11h8m-9 4h1m5 0h1M3 5h13a2 2 0 012 2v8a2 2 0 01-2 2H3V5zM19 9h1.5a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5H19" />
      </svg>
    ),
  },
  {
    title: 'Quality Equipment',
    desc: 'Well-maintained items — cleaned, checked and sanitized before every event.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 13l4 4L19 7M12 3l1.2 2.4L15.6 6.6 18 7.8l-2.4 1.2L14.4 11.4 13.2 14 12 15.8 10.8 14 9.6 11.4 8.4 9 6 7.8 8.4 6.6 10.8 5.4 12 3z" />
      </svg>
    ),
  },
  {
    title: '30 Years of Service',
    desc: 'Trusted by families across Rizal since 1995. Experience you can count on.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Large Inventory',
    desc: 'Chairs, tables, linens, covers, sashes, glassware and décor — ready for any size of party.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
]

const DOCS = {
  dti: {
    src: '/images/req/DTI.jpg',
    alt: "DTI Certificate of Business Name Registration - Jan and Jimel's Party Needs Shop",
    badge: 'DTI Certificate',
    title: 'Certificate of Business Name Registration',
    meta: 'Business Name No. 5418869 · Region IV-A (CALABARZON) · valid until December 2028',
    aspect: 'aspect-[2285/3000]',
  },
  bir: {
    src: '/images/req/BIR.jpg',
    alt: "BIR Certificate of Registration (Form 2303) - Jan and Jimel's Party Needs Shop",
    badge: 'BIR Certificate',
    title: 'Certificate of Registration (Form 2303)',
    meta: 'Registered since January 2019 · 9309 Other Service Activities',
    aspect: 'aspect-[1600/2115]',
    mask: { left: 7.5, top: 21, width: 31, height: 5 },
  },
}

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.6 },
}

export default function Landing() {
  const [lightbox, setLightbox] = useState(null)
  const [rates, setRates] = useState([])

  useEffect(() => {
    api
      .get('/items/')
      .then(({ data }) => setRates(data.results || data))
      .catch(() => {})
  }, [])

  const rateGroups = useMemo(() => {
    const g = {}
    for (const it of rates) {
      if (Number(it.rental_price) > 0) (g[it.category] ||= []).push(it)
    }
    return g
  }, [rates])

  const photoItems = useMemo(() => rates.filter((it) => it.photo_url), [rates])

  return (
    <div className="overflow-x-clip">
      {/* ================= HERO ================= */}
      <section className="relative flex min-h-screen items-center bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <Hero3D />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(7,17,38,0.75)_100%)]" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-6 pt-28 pb-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
          >
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold tracking-[0.22em] text-gold-300 uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
              Est. 1995 · Cainta, Rizal
            </p>
            <h1 className="font-display text-5xl leading-tight font-bold text-white sm:text-6xl lg:text-7xl">
              Celebrating Life's <span className="text-gradient-gold">Moments</span>
              <br />
              Since 1995
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              Jan &amp; Jimels Party Needs provides complete event rentals and supplies —
              chairs, tables, linens, tents, décor, sound and lights — delivered reliably
              to your venue anywhere in Rizal and beyond.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/quote"
                className="rounded-full bg-gold-500 px-8 py-3.5 text-sm font-semibold text-navy-950 shadow-xl shadow-gold-500/30 transition hover:scale-105 hover:bg-gold-400"
              >
                Request a Quote
              </Link>
              <a
                href="#gallery"
                className="rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition hover:border-gold-400 hover:text-gold-400"
              >
                View Our Work
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <span className="text-gold-400">✓</span> Reliable Delivery
              </span>
              <span className="flex items-center gap-2">
                <span className="text-gold-400">✓</span> Quality Equipment
              </span>
              <span className="flex items-center gap-2">
                <span className="text-gold-400">✓</span> Large Inventory
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-gold-500/10 blur-2xl" />
            <img
              src="/images/cover logo.jpg"
              alt="Jan & Jimels Party Needs cover"
              className="relative mx-auto w-full max-w-lg rounded-[2rem] border border-gold-500/30 object-cover shadow-2xl shadow-navy-950/60"
              style={{ transform: 'perspective(1200px) rotateY(-8deg) rotateX(3deg)' }}
            />
          </motion.div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/60">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="bg-navy-900 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 text-center sm:grid-cols-4">
          {[
            ['30+', 'Years of Service'],
            ['1000+', 'Items in Inventory'],
            ['5000+', 'Events Served'],
            ['100%', 'Reliable Delivery'],
          ].map(([num, label]) => (
            <div key={label}>
              <p className="font-display text-4xl font-bold text-gold-400">{num}</p>
              <p className="mt-1 text-xs tracking-widest text-white/60 uppercase">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section id="about" className="scroll-mt-24 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <img
              src="/images/cover logo.jpg"
              alt="Jan & Jimels Party Needs"
              className="w-full rounded-3xl border border-navy-100 object-cover shadow-xl shadow-navy-900/10"
            />
          </motion.div>
          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
            <p className="text-xs font-semibold tracking-[0.25em] text-gold-600 uppercase">
              About Us
            </p>
            <h2 className="font-display mt-3 text-4xl font-bold text-navy-900">
              Your Trusted Party Partner in <span className="text-gradient-gold">Cainta, Rizal</span>
            </h2>
            <p className="mt-5 leading-relaxed text-navy-800/80">
              For three decades, Jan &amp; Jimels Party Needs has been the go-to event
              rental supplier for families, churches and companies in Rizal. From intimate
              birthday parties to grand weddings, we provide everything you need — delivered,
              set up, and picked up with care.
            </p>
            <p className="mt-4 leading-relaxed text-navy-800/80">
              Our inventory is always cleaned, sanitized and inspected so your celebration
              looks beautiful and worry-free. Book with us today and experience service
              trusted for 30 years.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                to="/quote"
                className="rounded-full bg-navy-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-navy-700"
              >
                Get a Free Quote
              </Link>
              <a
                href="tel:09089503879"
                className="rounded-full border border-navy-200 px-7 py-3 text-sm font-semibold text-navy-800 transition hover:border-gold-500 hover:text-gold-600"
              >
                Call 0908-950-3879
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section id="services" className="scroll-mt-24 bg-navy-50/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-gold-600 uppercase">
              What We Offer
            </p>
            <h2 className="font-display mt-3 text-4xl font-bold text-navy-900">Our Services</h2>
          </motion.div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group rounded-3xl border border-navy-100 bg-white p-7 shadow-sm transition hover:-translate-y-1.5 hover:border-gold-400 hover:shadow-xl hover:shadow-gold-500/10"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-gold-400 shadow-lg transition group-hover:bg-navy-800 group-hover:text-gold-300">
                  {s.icon}
                </span>
                <h3 className="font-display mt-4 text-xl font-bold text-navy-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-800/80">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= GALLERY ================= */}
      <section id="gallery" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-gold-600 uppercase">
              Recent Events
            </p>
            <h2 className="font-display mt-3 text-4xl font-bold text-navy-900">Our Work in Action</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-navy-800/80">
              Real setups from real celebrations — weddings, debuts, birthdays and more,
              styled and supplied by Jan &amp; Jimels.
            </p>
          </motion.div>

          <div className="mt-12 columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
            {gallery.map((src, i) => (
              <motion.button
                key={src}
                {...fadeUp}
                transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
                onClick={() => setLightbox({ src })}
                className="group relative block w-full overflow-hidden rounded-2xl border border-navy-100"
              >
                <img
                  src={src}
                  alt={`Jan & Jimels event setup ${i + 1}`}
                  loading="lazy"
                  className="w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-navy-950/0 transition group-hover:bg-navy-950/25" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= OUR EQUIPMENT ================= */}
      {photoItems.length > 0 && (
        <section id="equipment-photos" className="scroll-mt-24 border-t border-navy-100 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div {...fadeUp} className="text-center">
              <p className="text-xs font-semibold tracking-[0.25em] text-gold-600 uppercase">
                Our Equipment
              </p>
              <h2 className="font-display mt-3 text-4xl font-bold text-navy-900">
                See What We'll Bring to Your Event
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-navy-800/80">
                A closer look at our catering equipment — cleaned, checked and ready for your
                celebration.
              </p>
            </motion.div>

            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photoItems.map((it, i) => (
                <motion.button
                  key={it.id}
                  {...fadeUp}
                  transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
                  type="button"
                  onClick={() => setLightbox({ src: it.photo_url, alt: it.name })}
                  className="group overflow-hidden rounded-3xl border border-navy-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-xl"
                >
                  <span className="block overflow-hidden">
                    <img
                      src={it.photo_url}
                      alt={it.name}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </span>
                  <span className="block p-4">
                    <span className="block text-[10px] font-semibold tracking-[0.18em] text-gold-600 uppercase">
                      {it.category_display}
                    </span>
                    <span className="font-display mt-1 block text-base font-bold text-navy-900">
                      {it.name}
                    </span>
                    <span className="mt-1 block text-xs text-navy-500">
                      {Number(it.rental_price) > 0
                        ? `₱${Number(it.rental_price).toLocaleString('en-PH')} / rental`
                        : 'Ask us for rates'}
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 text-center text-xs text-navy-500"
            >
              Click any photo to enlarge
            </motion.p>
          </div>
        </section>
      )}

      {/* ================= EQUIPMENT & RATES ================= */}
      <section id="equipment" className="scroll-mt-24 bg-navy-50/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-gold-600 uppercase">
              Equipment &amp; Rates
            </p>
            <h2 className="font-display mt-3 text-4xl font-bold text-navy-900">
              Everything Your Party Needs
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-navy-800/80">
              Chairs, tables, linens, tents and more — complete with rates you can trust.
              Prices are subject to change without prior notice.
            </p>
          </motion.div>

          <div className="mt-12 grid items-start gap-8 lg:grid-cols-5">
            <motion.div {...fadeUp} className="lg:col-span-2">
              <img
                src="/images/equipments.jpg"
                alt="Jan & Jimels equipment list"
                className="w-full rounded-3xl border border-navy-100 object-contain shadow-xl shadow-navy-900/10"
              />
              <p className="mt-3 text-center text-xs text-navy-500">
                Our full equipment list — from chairs and tables to glassware and utensils.
              </p>
            </motion.div>

            <div className="space-y-4 lg:col-span-3">
              {EQUIPMENT_GROUPS.map(([cat, title], gi) => {
                const list = rateGroups[cat]
                if (!list || list.length === 0) return null
                return (
                  <motion.div
                    key={cat}
                    {...fadeUp}
                    transition={{ duration: 0.5, delay: gi * 0.07 }}
                    className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-bold text-navy-900">{title}</h3>
                      <span className="text-xs font-semibold tracking-wide text-gold-600 uppercase">
                        Rate / Rental
                      </span>
                    </div>
                    <div className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      {list.map((it) => (
                        <div key={it.id} className="flex items-baseline justify-between gap-3 border-b border-dotted border-navy-100 py-1 text-sm">
                          <span className="text-navy-800">{it.name}</span>
                          <span className="shrink-0 font-semibold text-navy-900">
                            ₱{Number(it.rental_price).toLocaleString('en-PH')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
              <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/quote"
                  className="rounded-full bg-gold-500 px-7 py-3 text-sm font-semibold text-navy-950 shadow-lg shadow-gold-500/25 transition hover:scale-105 hover:bg-gold-400"
                >
                  Request a Quote with These Rates
                </Link>
                <a
                  href="tel:09089503879"
                  className="rounded-full border border-navy-200 px-7 py-3 text-sm font-semibold text-navy-800 transition hover:border-gold-500 hover:text-gold-600"
                >
                  Call 0908-950-3879
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHY US ================= */}
      <section className="bg-gradient-to-b from-navy-950 to-navy-800 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">
              Why Choose Us
            </p>
            <h2 className="font-display mt-3 text-4xl font-bold text-white">
              The Jan &amp; Jimels Promise
            </h2>
          </motion.div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((w, i) => (
              <motion.div
                key={w.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-7 text-center backdrop-blur transition hover:border-gold-500/50 hover:bg-white/10"
              >
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
                  {w.icon}
                </span>
                <h3 className="font-display mt-5 text-lg font-bold text-white">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= REGISTERED & TRUSTED ================= */}
      <section id="registered" className="scroll-mt-24 bg-navy-50/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-gold-600 uppercase">
              Registered &amp; Trusted
            </p>
            <h2 className="font-display mt-3 text-4xl font-bold text-navy-900">
              A Legitimately Registered Business
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-navy-800/80">
              Jan &amp; Jimels Party Needs Shop is duly registered with the Department of
              Trade and Industry (DTI) and the Bureau of Internal Revenue (BIR) — book
              with confidence.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {['DTI Registered', 'BIR Registered', 'Est. 1995'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-gold-500/40 bg-white px-5 py-2 text-xs font-semibold tracking-wide text-navy-800 uppercase"
                >
                  <span className="text-gold-600">✓</span> {t}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
            {Object.values(DOCS).map((doc, i) => (
              <motion.button
                key={doc.src}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                type="button"
                onClick={() => setLightbox({ src: doc.src, alt: doc.alt, mask: doc.mask })}
                className="group rounded-3xl border border-navy-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-xl"
              >
                <span className={`relative block overflow-hidden rounded-2xl border border-navy-100 ${doc.aspect}`}>
                  <img
                    src={doc.src}
                    alt={doc.alt}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                  />
                  {doc.mask && (
                    <span
                      aria-hidden="true"
                      className="absolute rounded-sm bg-navy-900 ring-1 ring-white/25"
                      style={{
                        left: `${doc.mask.left}%`,
                        top: `${doc.mask.top}%`,
                        width: `${doc.mask.width}%`,
                        height: `${doc.mask.height}%`,
                      }}
                    />
                  )}
                </span>
                <p className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-gold-600 uppercase">
                  {doc.badge}
                </p>
                <h3 className="font-display mt-1 text-lg font-bold text-navy-900">{doc.title}</h3>
                <p className="mt-1 text-xs text-navy-500">{doc.meta}</p>
                <p className="mt-2 text-[11px] font-semibold text-gold-600">
                  Click to view full document ↗
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CONTACT / CTA ================= */}
      <section id="contact" className="scroll-mt-24 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <p className="text-xs font-semibold tracking-[0.25em] text-gold-600 uppercase">
              Contact Us
            </p>
            <h2 className="font-display mt-3 text-4xl font-bold text-navy-900">
              Plan Your Next Event With Us
            </h2>
            <p className="mt-4 text-navy-800/75">
              Message us for a free quotation. Just tell us your event date, venue and the
              items you need — we'll take care of the rest.
            </p>
            <ul className="mt-8 space-y-5">
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-navy-900">Visit Us</p>
                  <p className="text-sm text-navy-800/80">
                    #1 Pelota St., Saint Francis Village, Cainta, Rizal
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-navy-900">Call or Text</p>
                  <p className="text-sm text-navy-800/80">
                    0908-950-3879 · 0999-760-3211
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-navy-900">Email</p>
                  <p className="text-sm text-navy-800/80">janjimels95@gmail.com</p>
                </div>
              </li>
            </ul>
            <Link
              to="/quote"
              className="mt-9 inline-block rounded-full bg-gold-500 px-8 py-3.5 text-sm font-semibold text-navy-950 shadow-xl shadow-gold-500/25 transition hover:scale-105 hover:bg-gold-400"
            >
              Request a Free Quotation
            </Link>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
            <div className="h-full min-h-[380px] overflow-hidden rounded-3xl border border-navy-100 shadow-xl shadow-navy-900/10">
              <iframe
                title="Jan & Jimels Party Needs location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=121.1016%2C14.5652%2C121.1348%2C14.5864&layer=mapnik&marker=14.5758%2C121.1182"
                className="h-full w-full"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= LIGHTBOX ================= */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/90 p-6 backdrop-blur"
          onClick={() => setLightbox(null)}
        >
          {lightbox.mask ? (
            <span className="relative inline-block">
              <img
                src={lightbox.src}
                alt={lightbox.alt || 'Document'}
                className="max-h-[85vh] max-w-full rounded-2xl border border-gold-500/30"
              />
              <span
                aria-hidden="true"
                className="absolute rounded-sm bg-navy-900 ring-1 ring-white/25"
                style={{
                  left: `${lightbox.mask.left}%`,
                  top: `${lightbox.mask.top}%`,
                  width: `${lightbox.mask.width}%`,
                  height: `${lightbox.mask.height}%`,
                }}
              />
            </span>
          ) : (
            <img
              src={lightbox.src}
              alt={lightbox.alt || 'Event gallery'}
              className="max-h-[85vh] max-w-full rounded-2xl border border-gold-500/30 object-contain"
            />
          )}
          <button
            className="absolute top-6 right-6 text-white/80 transition hover:text-gold-400"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
