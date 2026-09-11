import html2canvas from 'html2canvas'
import { useEffect, useState } from 'react'

import QuotePreview from '../components/QuotePreview'
import { BigButton, EmptyState, Modal, TopBar } from '../components/ui'
import { formatDate, formatPHPShort } from '../lib/format'
import { buildQuotationPdfBlob } from '../lib/quotePdf'
import { shareFile } from '../lib/share'
import { storage } from '../lib/storage'

export default function Quotes() {
  const [quotes, setQuotes] = useState([])
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const load = () => storage.getQuotes().then(setQuotes)
  useEffect(() => {
    load()
  }, [])

  const sharePdf = async (quote) => {
    setBusy('pdf')
    setError('')
    try {
      const { blob, filename } = await buildQuotationPdfBlob(quote)
      await shareFile({ blob, filename, title: filename, text: `Quotation for ${quote.customerName}` })
    } catch (e) {
      setError(`Could not create the PDF: ${e.message || e}`)
    } finally {
      setBusy('')
    }
  }

  const shareImage = async (quote) => {
    setBusy('image')
    setError('')
    try {
      const el = document.getElementById('quote-preview')
      if (!el) throw new Error('Preview not ready')
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      await shareFile({
        blob,
        filename: `Quotation-${quote.customerName.replace(/\s+/g, '-')}-${quote.dateISO}.png`,
        mimeType: 'image/png',
        title: 'Quotation Image',
        text: `Quotation for ${quote.customerName}`,
      })
    } catch (e) {
      setError(`Could not create the image: ${e.message || e}`)
    } finally {
      setBusy('')
    }
  }

  const remove = async (quote) => {
    if (!window.confirm(`Delete quotation for ${quote.customerName}?`)) return
    await storage.deleteQuote(quote.id)
    setSelected(null)
    load()
  }

  return (
    <div className="safe-top min-h-screen bg-navy-50">
      <TopBar title="Saved Quotations" onBack={() => window.history.back()} />
      <div className="safe-bottom mx-auto max-w-lg space-y-3 px-4 py-5">
        {quotes.length === 0 && (
          <EmptyState
            icon="📁"
            title="No saved quotations yet"
            subtitle="Quotations you create are saved here automatically when you share them."
          />
        )}
        {quotes.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => {
              setSelected(q)
              setError('')
            }}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-navy-100 bg-white px-4 py-4 text-left active:bg-navy-50"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-navy-900">{q.customerName}</span>
              <span className="block text-xs text-navy-400">
                {formatDate(q.dateISO)}
                {q.eventDate ? ` · Event ${formatDate(q.eventDate)}` : ''}
              </span>
            </span>
            <span className="text-base font-bold text-navy-900">{formatPHPShort(q.total)}</span>
          </button>
        ))}
      </div>

      {selected && (
        <Modal
          title={selected.customerName}
          onClose={() => setSelected(null)}
          footer={
            <div className="space-y-2">
              <BigButton onClick={() => sharePdf(selected)} disabled={busy === 'pdf'}>
                {busy === 'pdf' ? 'Creating PDF…' : '📄 Share PDF'}
              </BigButton>
              <BigButton variant="navy" onClick={() => shareImage(selected)} disabled={busy === 'image'}>
                {busy === 'image' ? 'Creating image…' : '🖼️ Share as Image'}
              </BigButton>
              <BigButton variant="danger" onClick={() => remove(selected)}>
                🗑 Delete quotation
              </BigButton>
            </div>
          }
        >
          {error && (
            <p className="mb-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
          <QuotePreview quote={selected} />
        </Modal>
      )}
    </div>
  )
}
