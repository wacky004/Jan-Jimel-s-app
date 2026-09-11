import html2canvas from 'html2canvas'
import { useEffect, useState } from 'react'

import QuotePreview from '../components/QuotePreview'
import { BigButton, EmptyState, Modal, TopBar } from '../components/ui'
import { formatDate, formatPHPShort } from '../lib/format'
import { buildQuotationPdfBlob } from '../lib/quotePdf'
import { saveFile, shareFile } from '../lib/share'
import { storage } from '../lib/storage'

export default function Quotes() {
  const [quotes, setQuotes] = useState([])
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  const load = () => storage.getQuotes().then(setQuotes)
  useEffect(() => {
    load()
  }, [])

  const openQuote = (q) => {
    setSelected(q)
    setError('')
    setSaveMsg('')
  }

  const captureImageBlob = async () => {
    const el = document.getElementById('quote-preview-export')
    if (!el) throw new Error('Preview not ready')
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  }

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

  const savePdf = async (quote) => {
    setBusy('savepdf')
    setError('')
    setSaveMsg('')
    try {
      const { blob, filename } = await buildQuotationPdfBlob(quote)
      const result = await saveFile({ blob, filename })
      setSaveMsg(`Saved to ${result.location}: ${filename}`)
    } catch (e) {
      setError(`Could not save the PDF: ${e.message || e}`)
    } finally {
      setBusy('')
    }
  }

  const shareImage = async (quote) => {
    setBusy('image')
    setError('')
    try {
      const blob = await captureImageBlob()
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

  const saveImage = async (quote) => {
    setBusy('saveimage')
    setError('')
    setSaveMsg('')
    try {
      const blob = await captureImageBlob()
      const filename = `Quotation-${quote.customerName.replace(/\s+/g, '-')}-${quote.dateISO}.png`
      const result = await saveFile({ blob, filename })
      setSaveMsg(`Saved to ${result.location}: ${filename}`)
    } catch (e) {
      setError(`Could not save the image: ${e.message || e}`)
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
            subtitle="Quotations you create are saved here automatically when you share or save them."
          />
        )}
        {quotes.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => openQuote(q)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-navy-100 bg-white px-4 py-4 text-left active:bg-navy-50"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base leading-snug font-bold break-words text-navy-900">{q.customerName}</span>
              <span className="block text-xs text-navy-400">
                {formatDate(q.dateISO)}
                {q.eventDate ? ` · Event ${formatDate(q.eventDate)}` : ''}
              </span>
            </span>
            <span className="shrink-0 text-base font-bold text-navy-900">{formatPHPShort(q.total)}</span>
          </button>
        ))}
      </div>

      {selected && (
        <Modal
          title={selected.customerName}
          onClose={() => setSelected(null)}
          footer={
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <BigButton onClick={() => sharePdf(selected)} disabled={busy === 'pdf'}>
                  {busy === 'pdf' ? 'Creating…' : '📤 Share PDF'}
                </BigButton>
                <BigButton variant="navy" onClick={() => savePdf(selected)} disabled={busy === 'savepdf'}>
                  {busy === 'savepdf' ? 'Saving…' : '💾 Save PDF'}
                </BigButton>
                <BigButton variant="outline" onClick={() => shareImage(selected)} disabled={busy === 'image'}>
                  {busy === 'image' ? 'Creating…' : '📤 Share Image'}
                </BigButton>
                <BigButton variant="outline" onClick={() => saveImage(selected)} disabled={busy === 'saveimage'}>
                  {busy === 'saveimage' ? 'Saving…' : '💾 Save Image'}
                </BigButton>
              </div>
              <BigButton variant="danger" onClick={() => remove(selected)}>
                🗑 Delete quotation
              </BigButton>
            </div>
          }
        >
          {error && (
            <p className="mb-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold break-words text-red-700">
              {error}
            </p>
          )}
          {saveMsg && (
            <p className="mb-3 rounded-2xl border-2 border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold break-words text-green-700">
              ✓ {saveMsg}
            </p>
          )}
          <QuotePreview quote={selected} />

          {/* Hidden A4-width copy used for image export */}
          <div aria-hidden="true" style={{ position: 'fixed', left: -10000, top: 0, width: 794, pointerEvents: 'none' }}>
            <QuotePreview quote={selected} id="quote-preview-export" />
          </div>
        </Modal>
      )}
    </div>
  )
}
