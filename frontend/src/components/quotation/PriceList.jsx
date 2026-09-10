import { useState } from 'react'
import { ChevronDown, ChevronUp, Download } from 'lucide-react'
import { Button, InlineAlert } from '../ui'
import useMediaQuery from '../../hooks/useMediaQuery'
import { PRICELIST_GROUPS } from './quotationData'
import { downloadPricelist } from './downloadPricelist'

export default function PriceList({ grouped, status }) {
  const desktop = useMediaQuery('(min-width: 768px)')
  const [choice, setChoice] = useState(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const open = choice ?? desktop
  const hasItems = Object.values(grouped).some((list) => list.length)
  const download = async () => {
    setBusy(true); setFeedback(null)
    try { await downloadPricelist(grouped); setFeedback({ tone: 'success', text: 'Your price-list download is ready. Check your browser downloads.' }) }
    catch { setFeedback({ tone: 'error', text: 'The price list could not be downloaded. Please try the download again.' }) }
    finally { setBusy(false) }
  }
  return <section className="quote-price-list" aria-labelledby="price-list-heading">
    <div className="quote-price-heading"><div><h3 id="price-list-heading">Full price list</h3><p>Rates per rental. Prices are subject to change.</p></div>
      <div className="quote-actions"><Button variant="secondary" aria-expanded={open} aria-controls="quotation-rates" onClick={() => setChoice(!open)}>{open ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}{open ? 'Hide rates' : 'Show rates'}</Button>
      <Button variant="conversion" onClick={download} disabled={status !== 'loaded' || !hasItems} busy={busy} busyLabel="Preparing PDF…"><Download size={18} aria-hidden="true" />Download price list (PDF)</Button></div>
    </div>
    {feedback && <InlineAlert tone={feedback.tone}>{feedback.text}</InlineAlert>}
    <div id="quotation-rates" hidden={!open}>
      {status !== 'loaded' ? <p>The full list will appear when the equipment catalog loads.</p> : !hasItems ? <p>No prices are available yet. Contact us about your equipment needs.</p> : <div className="quote-price-grid">{PRICELIST_GROUPS.map(([category, title]) => !grouped[category]?.length ? null : <div key={category}><h4>{title}</h4><dl>{grouped[category].map((item) => <div key={item.id}><dt>{item.photo_url && <img src={item.photo_url} alt="" width="32" height="32" loading="lazy" />}{item.name}</dt><dd>{Number(item.rental_price) > 0 ? `₱${Number(item.rental_price).toLocaleString('en-PH')}` : '—'}</dd></div>)}</dl></div>)}</div>}
    </div>
  </section>
}
