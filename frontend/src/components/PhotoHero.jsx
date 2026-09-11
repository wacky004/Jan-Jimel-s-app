import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import HeroParticles from './HeroParticles'

const SLIDES = [
  {
    src: '/images/480503876_1066078128871153_5075517710706458478_n.jpg',
    alt: 'Elegant garden terrace event setup with white and gold table settings',
  },
  {
    src: '/images/480586199_1066078138871152_2727808754987400924_n.jpg',
    alt: 'Grand event hall with purple uplighting and floral stage backdrop',
  },
  {
    src: '/images/480709260_1066078108871155_4613203331543894433_n.jpg',
    alt: 'Banquet setup with red napkins and gold candelabras',
  },
  {
    src: '/images/119560072_974973499594963_66919201614516531_n.jpg',
    alt: 'Catering buffet with chafing dishes and ruffled table skirting',
  },
]

const isMobile =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const isReduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function PhotoHero() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (isReduced) return
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-navy-950">
      {/* Photo slideshow */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`h-full w-full object-cover ${
              i === index && !isReduced && !isMobile ? 'animate-kenburns' : ''
            }`}
          />
        </div>
      ))}

      {/* Legibility overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/70 to-navy-950/25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-navy-950/50" />

      {/* Floating gold bokeh (3D, parallax) */}
      <div className="pointer-events-none absolute inset-0">
        <HeroParticles />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-6 pt-28 pb-24 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold tracking-[0.22em] text-gold-300 uppercase backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
            Est. 1995 · Cainta, Rizal
          </p>
          <h1 className="font-display text-5xl leading-tight font-bold text-white sm:text-6xl lg:text-7xl">
            Celebrating Life's <span className="text-gradient-gold">Moments</span>
            <br />
            Since 1995
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
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
              className="rounded-full border border-white/25 bg-navy-950/30 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-gold-400 hover:text-gold-400"
            >
              View Our Work
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/75">
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

      {/* Photo dots */}
      <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 gap-1">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show photo ${i + 1}`}
            className="flex h-11 w-11 items-center justify-center"
          >
            <span
              className={`block h-3.5 w-3.5 rounded-full border-2 transition ${
                i === index
                  ? 'scale-110 border-gold-500 bg-gold-500'
                  : 'border-white/60 bg-white/25 hover:bg-white/50'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/60">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
