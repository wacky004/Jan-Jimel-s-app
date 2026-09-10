import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../../api'
import { EmptyState, ErrorState, LoadingSkeleton } from '../ui'
import QuoteLink from './QuoteLink'

const groups = [['chairs', 'Chairs'], ['tables', 'Tables'], ['linens', 'Linen & Décor'], ['tents', 'Tent'], ['glassware', 'Equipment']]

export default function Rentals() {
  const [state, setState] = useState({ status: 'loading', items: [] })
  const [attempt, setAttempt] = useState(0)
  const heading = useRef(null)
  useEffect(() => {
    let active = true
    api.get('/items/').then(({ data }) => {
      const items = data.results || data
      if (!Array.isArray(items)) throw new Error('Invalid catalog response')
      if (active) setState({ status: 'loaded', items })
    }).catch(() => { if (active) setState({ status: 'error', items: [] }) })
    return () => { active = false }
  }, [attempt])
  const rateGroups = useMemo(() => {
    const result = {}
    for (const item of state.items) {
      if (Number(item.rental_price) > 0) (result[item.category] ||= []).push(item)
    }
    return result
  }, [state.items])
  const hasRates = groups.some(([category]) => rateGroups[category]?.length)

  return <section id="equipment" tabIndex={-1} className="public-section public-soft" aria-labelledby="equipment-heading">
    <div className="public-shell">
      <div className="public-section-heading"><p className="public-eyebrow">Rentals &amp; rates</p><h2 id="equipment-heading">Start with the essentials.</h2><p>Chairs, tables, linens and the finishing touches. Browse the current rate preview, then tell us what your event needs.</p></div>
      <div className="public-rentals-grid">
        <figure className="public-equipment-poster"><a href="/images/equipments.jpg" target="_blank" rel="noopener noreferrer" aria-label="Open the equipment poster at full size in a new tab"><img src="/images/equipments.jpg" alt="Jan & Jimels equipment poster with chairs, tables, linens, tents and glassware" width="847" height="1250" loading="lazy" /></a><figcaption>Our equipment poster. <a href="/images/equipments.jpg" target="_blank" rel="noopener noreferrer">Open full size (new tab)</a></figcaption></figure>
        <div className="public-live-rates">
          <h3 ref={heading} tabIndex={-1}>Current rental rates</h3><p className="public-small">Prices are subject to change. Request a quote to confirm your items and event details.</p>
          <p className="ui-sr-only" role="status">{state.status === 'loaded' ? (hasRates ? 'Rental rates loaded.' : 'No rental rates available.') : ''}</p>
          {state.status === 'loading' && <LoadingSkeleton label="Loading rental rates" lines={8} />}
          {state.status === 'error' && <ErrorState title="Rental rates couldn’t be loaded" onRetry={() => { heading.current?.focus(); setState({ status: 'loading', items: [] }); setAttempt((value) => value + 1) }}>Please try again. You can still request a quote or contact us about the items you need.</ErrorState>}
          {state.status === 'loaded' && !hasRates && <EmptyState title="No rental rates to display">Contact us or request a quote for current pricing.</EmptyState>}
          {state.status === 'loaded' && hasRates && <div className="public-rate-groups">{groups.map(([category, title]) => !rateGroups[category]?.length ? null : <section key={category} className="public-rate-group" aria-label={`${title} rental rates`}><h4>{title}</h4><dl>{rateGroups[category].map((item) => <div key={item.id}><dt>{item.name}</dt><dd>₱{Number(item.rental_price).toLocaleString('en-PH')}</dd></div>)}</dl></section>)}</div>}
          <QuoteLink />
        </div>
      </div>
    </div>
  </section>
}
