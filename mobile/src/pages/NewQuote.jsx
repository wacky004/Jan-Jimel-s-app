import html2canvas from 'html2canvas'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PackageBuilder from '../components/PackageBuilder'
import QuotePreview from '../components/QuotePreview'
import { BigButton, Field, inputClass, Modal, MoneyInput, Stepper, TopBar } from '../components/ui'
import { setPageBackHandler } from '../lib/backButton'
import { formatPHPShort, newId, todayISO } from '../lib/format'
import { buildQuotationPdfBlob } from '../lib/quotePdf'
import { saveFile, shareFile } from '../lib/share'
import { storage } from '../lib/storage'

const STEPS = ['Customer', 'Items', 'Review', 'Generate']

export default function NewQuote() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [catalog, setCatalog] = useState([])
  const [packages, setPackages] = useState([])
  const [customers, setCustomers] = useState([])
  const [customer, setCustomer] = useState({ name: '', phone: '', eventDate: '', eventType: '', venue: '', notes: '' })
  const [lines, setLines] = useState([])
  const [discount, setDiscount] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [setupFee, setSetupFee] = useState('')
  const [tab, setTab] = useState('packages')
  const [partyCategory, setPartyCategory] = useState(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editLine, setEditLine] = useState(null)
  const [customLineOpen, setCustomLineOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [saved, setSaved] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [exitConfirm, setExitConfirm] = useState(false)

  useEffect(() => {
    Promise.all([storage.getCatalog(), storage.getPackages(), storage.getCustomers()]).then(
      ([c, p, cu]) => {
        setCatalog(c)
        setPackages(p)
        setCustomers(cu.slice(0, 8))
      },
    )
  }, [])

  const dirty = Boolean(
    customer.name.trim() ||
      customer.phone.trim() ||
      customer.eventDate ||
      customer.eventType ||
      customer.venue ||
      customer.notes.trim() ||
      lines.length > 0 ||
      discount ||
      deliveryFee ||
      setupFee,
  )

  // Android back gesture: confirm before leaving a quotation in progress
  useEffect(() => {
    setPageBackHandler(() => {
      if (dirty) {
        setExitConfirm(true)
        return true
      }
      return false
    })
    return () => setPageBackHandler(null)
  }, [dirty])

  const partyItems = useMemo(() => catalog.filter((it) => it.type === 'party'), [catalog])
  const groupedParty = useMemo(() => {
    const g = {}
    for (const it of partyItems) (g[it.category] ||= []).push(it)
    return g
  }, [partyItems])
  const partyCategories = Object.keys(groupedParty)

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + Number(l.qty) * Number(l.unitPrice || 0), 0),
    [lines],
  )
  const delivery = Number(deliveryFee || 0)
  const setup = Number(setupFee || 0)
  const total = Math.max(subtotal - Number(discount || 0) + delivery + setup, 0)

  const qtyOf = (catalogId) => lines.find((l) => l.catalogId === catalogId)?.qty || 0
  const itemLine = (catalogId) => lines.find((l) => l.catalogId === catalogId)
  const pkgLine = (pkgId) => lines.find((l) => l.packageId === pkgId)

  const selectedCountFor = (category) =>
    (groupedParty[category] || []).filter((it) => itemLine(it.id)).length

  const changeItemQty = (item, qty) => {
    setLines((arr) => {
      const existing = arr.find((l) => l.catalogId === item.id)
      if (qty <= 0) return arr.filter((l) => l.catalogId !== item.id)
      if (existing) return arr.map((l) => (l.catalogId === item.id ? { ...l, qty } : l))
      return [
        ...arr,
        { id: newId(), type: 'item', catalogId: item.id, name: item.name, qty, unitPrice: Number(item.price) },
      ]
    })
  }

  const setItemPrice = (catalogId, value) => {
    setLines((arr) => arr.map((l) => (l.catalogId === catalogId ? { ...l, unitPrice: value } : l)))
  }

  const addPackage = (pkg) => {
    setLines((arr) => {
      const existing = arr.find((l) => l.packageId === pkg.id)
      if (existing) return arr.map((l) => (l.packageId === pkg.id ? { ...l, qty: l.qty + 1 } : l))
      return [
        ...arr,
        { id: newId(), type: 'package', packageId: pkg.id, name: pkg.name, qty: 1, unitPrice: Number(pkg.price) },
      ]
    })
  }

  const setPackagePrice = (pkgId, value) => {
    setLines((arr) => arr.map((l) => (l.packageId === pkgId ? { ...l, unitPrice: value } : l)))
  }

  const savePackage = async (pkg) => {
    const next = await storage.upsertPackage(pkg)
    setPackages(next)
    setBuilderOpen(false)
  }

  const addCustomLine = () => {
    if (!customName.trim()) return
    setLines((arr) => [
      ...arr,
      { id: newId(), type: 'custom', name: customName.trim(), qty: 1, unitPrice: Number(customPrice || 0) },
    ])
    setCustomName('')
    setCustomPrice('')
    setCustomLineOpen(false)
  }

  const removeLine = (id) => setLines((arr) => arr.filter((l) => l.id !== id))

  const updateLine = (id, patch) =>
    setLines((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)))

  const buildQuoteData = () => ({
    customerName: customer.name.trim(),
    phone: customer.phone.trim(),
    eventDate: customer.eventDate,
    eventType: customer.eventType.trim(),
    venue: customer.venue.trim(),
    notes: customer.notes.trim(),
    discount: Number(discount || 0),
    deliveryFee: delivery,
    setupFee: setup,
    dateISO: todayISO(),
    lines,
  })

  const next = () => {
    setError('')
    if (step === 0 && !customer.name.trim()) return setError('Please enter the customer name.')
    if (step === 1 && lines.length === 0) return setError('Please add at least one item or package.')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => {
    setError('')
    if (step === 0) {
      if (dirty) return setExitConfirm(true)
      return navigate('/')
    }
    setStep((s) => s - 1)
  }

  const captureImageBlob = async () => {
    const el = document.getElementById('quote-preview-export')
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  }

  const sharePdf = async () => {
    setBusy('pdf')
    setError('')
    setSaveMsg('')
    try {
      const data = buildQuoteData()
      const { blob, filename } = await buildQuotationPdfBlob(data)
      await shareFile({ blob, filename, title: filename, text: `Quotation for ${data.customerName}` })
      await persistQuote()
    } catch (e) {
      setError(`Could not create the PDF: ${e.message || e}`)
    } finally {
      setBusy('')
    }
  }

  const savePdf = async () => {
    setBusy('savepdf')
    setError('')
    setSaveMsg('')
    try {
      const data = buildQuoteData()
      const { blob, filename } = await buildQuotationPdfBlob(data)
      const result = await saveFile({ blob, filename })
      setSaveMsg(`Saved to ${result.location}: ${filename}`)
      await persistQuote()
    } catch (e) {
      setError(`Could not save the PDF: ${e.message || e}`)
    } finally {
      setBusy('')
    }
  }

  const shareImage = async () => {
    setBusy('image')
    setError('')
    setSaveMsg('')
    try {
      const blob = await captureImageBlob()
      const data = buildQuoteData()
      await shareFile({
        blob,
        filename: `Quotation-${data.customerName.replace(/\s+/g, '-')}-${data.dateISO}.png`,
        mimeType: 'image/png',
        title: 'Quotation Image',
        text: `Quotation for ${data.customerName}`,
      })
      await persistQuote()
    } catch (e) {
      setError(`Could not create the image: ${e.message || e}`)
    } finally {
      setBusy('')
    }
  }

  const saveImage = async () => {
    setBusy('saveimage')
    setError('')
    setSaveMsg('')
    try {
      const blob = await captureImageBlob()
      const data = buildQuoteData()
      const filename = `Quotation-${data.customerName.replace(/\s+/g, '-')}-${data.dateISO}.png`
      const result = await saveFile({ blob, filename })
      setSaveMsg(`Saved to ${result.location}: ${filename}`)
      await persistQuote()
    } catch (e) {
      setError(`Could not save the image: ${e.message || e}`)
    } finally {
      setBusy('')
    }
  }

  const persistQuote = async () => {
    if (saved) return
    const data = buildQuoteData()
    await storage.saveQuote({ ...data, total })
    await storage.rememberCustomer(data.customerName, data.phone)
    setSaved(true)
  }

  const startNew = () => {
    setCustomer({ name: '', phone: '', eventDate: '', eventType: '', venue: '', notes: '' })
    setLines([])
    setDiscount('')
    setDeliveryFee('')
    setSetupFee('')
    setStep(0)
    setSaved(false)
    setError('')
    setSaveMsg('')
    setPartyCategory(null)
  }

  const priceField = (value, onValue) => (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-xs font-bold tracking-wide text-navy-500 uppercase">Price for this quote</span>
      <div className="flex items-center rounded-xl border-2 border-gold-500/60 bg-gold-100/40 px-2">
        <span className="text-sm font-bold text-navy-400">PHP</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={value === 0 || value === '0' ? '' : (value ?? '')}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onValue(e.target.value)}
          className="w-24 bg-transparent py-1.5 text-base font-bold text-navy-900 outline-none"
        />
      </div>
    </div>
  )

  return (
    <div className="safe-top min-h-screen bg-navy-50">
      <TopBar title={STEPS[step]} onBack={back} />

      {/* Progress */}
      <div className="flex gap-1 bg-white px-4 pb-3">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-gold-500' : 'bg-navy-100'}`} />
        ))}
      </div>

      <div className="safe-bottom mx-auto max-w-lg px-4 py-5">
        {/* ============ STEP 1: CUSTOMER ============ */}
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Customer name *">
              <input
                className={inputClass}
                placeholder="e.g. Maria Santos"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                autoFocus
              />
            </Field>
            <Field label="Phone number">
              <input
                className={inputClass}
                placeholder="09XX-XXX-XXXX"
                inputMode="tel"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
            </Field>
            {customers.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-bold tracking-wide text-navy-700 uppercase">Recent customers</p>
                <div className="flex flex-wrap gap-2">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCustomer({ ...customer, name: c.name, phone: c.phone || '' })}
                      className="rounded-full border-2 border-navy-100 bg-white px-4 py-2 text-sm font-semibold text-navy-800 active:bg-navy-50"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Event date">
                <input
                  type="date"
                  className={inputClass}
                  value={customer.eventDate}
                  onChange={(e) => setCustomer({ ...customer, eventDate: e.target.value })}
                />
              </Field>
              <Field label="Event type">
                <select
                  className={inputClass}
                  value={customer.eventType}
                  onChange={(e) => setCustomer({ ...customer, eventType: e.target.value })}
                >
                  <option value="">Select…</option>
                  {['Wedding', 'Debut', 'Birthday', 'Christening', 'Corporate', 'Anniversary', 'Fiesta', 'Other'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Venue">
              <input
                className={inputClass}
                placeholder="e.g. Village clubhouse, Cainta"
                value={customer.venue}
                onChange={(e) => setCustomer({ ...customer, venue: e.target.value })}
              />
            </Field>
          </div>
        )}

        {/* ============ STEP 2: ITEMS ============ */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex rounded-2xl border-2 border-navy-100 bg-white p-1">
              <button
                type="button"
                onClick={() => setTab('packages')}
                className={`tap-target flex-1 rounded-xl text-base font-bold ${tab === 'packages' ? 'bg-navy-800 text-white' : 'text-navy-600'}`}
              >
                📦 Equipment
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('party')
                  setPartyCategory(null)
                }}
                className={`tap-target flex-1 rounded-xl text-base font-bold ${tab === 'party' ? 'bg-navy-800 text-white' : 'text-navy-600'}`}
              >
                🪑 Party Needs
              </button>
            </div>

            {tab === 'packages' ? (
              <div className="space-y-3">
                {packages.map((pkg) => {
                  const line = pkgLine(pkg.id)
                  const included = pkg.items || []
                  const summary =
                    included.length > 0
                      ? `${included.slice(0, 3).map((i) => `${i.qty} ${i.name}`).join(', ')}${included.length > 3 ? ` +${included.length - 3} more` : ''}`
                      : ''
                  return (
                    <div key={pkg.id} className="rounded-3xl border-2 border-navy-100 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg leading-snug font-bold break-words text-navy-900">{pkg.name}</p>
                          <p className="text-sm text-navy-500">{formatPHPShort(line ? line.unitPrice : pkg.price)}</p>
                          {summary && <p className="mt-1 text-xs leading-snug text-navy-400">{summary}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => addPackage(pkg)}
                          className="tap-target rounded-2xl bg-gold-500 px-5 text-base font-bold text-navy-950 active:bg-gold-400"
                        >
                          + Add
                        </button>
                      </div>
                      {line && priceField(line.unitPrice, (v) => setPackagePrice(pkg.id, v))}
                    </div>
                  )
                })}
                {packages.length === 0 && (
                  <p className="rounded-3xl border-2 border-dashed border-navy-200 bg-white/60 px-4 py-8 text-center text-sm text-navy-500">
                    No packages yet. Build one below.
                  </p>
                )}
                <BigButton variant="outline" onClick={() => setBuilderOpen(true)}>
                  ➕ Build a Package
                </BigButton>
              </div>
            ) : partyCategory === null ? (
              /* ---- Party Needs: choose a category ---- */
              <div className="space-y-3">
                {partyCategories.map((category) => {
                  const list = groupedParty[category]
                  const count = selectedCountFor(category)
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setPartyCategory(category)}
                      className="flex w-full items-center justify-between gap-3 rounded-3xl border-2 border-navy-100 bg-white p-5 text-left active:bg-navy-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-bold break-words text-navy-900">{category}</span>
                        <span className="block text-sm text-navy-500">
                          {list.length} items
                          {count > 0 ? ` · ${count} selected` : ''}
                        </span>
                      </span>
                      <span className="text-2xl text-gold-600">›</span>
                    </button>
                  )
                })}
                {partyCategories.length === 0 && (
                  <p className="rounded-3xl border-2 border-dashed border-navy-200 bg-white/60 px-4 py-8 text-center text-sm text-navy-500">
                    No party needs yet. Add items in Items &amp; Prices.
                  </p>
                )}
              </div>
            ) : (
              /* ---- Party Needs: items in the chosen category ---- */
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPartyCategory(null)}
                  className="tap-target flex w-full items-center gap-2 rounded-2xl border-2 border-navy-100 bg-white px-4 text-base font-bold text-navy-700 active:bg-navy-50"
                >
                  ← All categories
                </button>
                <p className="text-lg font-bold break-words text-navy-900">{partyCategory}</p>
                {(groupedParty[partyCategory] || []).map((it) => {
                  const line = itemLine(it.id)
                  return (
                    <div key={it.id} className="rounded-2xl border-2 border-navy-100 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-base leading-snug font-semibold break-words text-navy-900">{it.name}</p>
                          <p className="text-xs text-navy-400">
                            {formatPHPShort(line ? line.unitPrice : it.price)} each
                          </p>
                        </div>
                        <Stepper value={qtyOf(it.id)} onChange={(q) => changeItemQty(it, q)} />
                      </div>
                      {line && priceField(line.unitPrice, (v) => setItemPrice(it.id, v))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ============ STEP 3: REVIEW ============ */}
        {step === 2 && (
          <div className="space-y-4">
            {lines.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setEditLine(l)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-navy-100 bg-white px-4 py-3 text-left active:bg-navy-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-snug font-semibold break-words text-navy-900">
                    {l.name} {l.type === 'package' && <span className="text-xs text-gold-600">(package)</span>}
                  </span>
                  <span className="block text-xs text-navy-400">
                    {l.qty} × {formatPHPShort(l.unitPrice)} · tap to edit
                  </span>
                </span>
                <span className="shrink-0 text-base font-bold text-navy-900">
                  {formatPHPShort(Number(l.qty) * Number(l.unitPrice || 0))}
                </span>
              </button>
            ))}

            <BigButton variant="outline" onClick={() => setCustomLineOpen(true)}>
              ➕ Add custom item
            </BigButton>

            <div>
              <p className="mb-1.5 text-sm font-bold tracking-wide text-navy-700 uppercase">Discount (optional)</p>
              <MoneyInput value={discount} onChange={setDiscount} placeholder="0.00" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-sm font-bold tracking-wide text-navy-700 uppercase">Delivery Fee</p>
                <MoneyInput value={deliveryFee} onChange={setDeliveryFee} placeholder="0.00" />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-bold tracking-wide text-navy-700 uppercase">Setup Fee</p>
                <MoneyInput value={setupFee} onChange={setSetupFee} placeholder="0.00" />
              </div>
            </div>
            <p className="text-xs text-navy-400">Leave blank if free (e.g. nearby locations).</p>

            <div className="rounded-3xl bg-navy-800 px-5 py-4 text-white">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Subtotal</span>
                <span>{formatPHPShort(subtotal)}</span>
              </div>
              {Number(discount) > 0 && (
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Discount</span>
                  <span>- {formatPHPShort(discount)}</span>
                </div>
              )}
              {delivery > 0 && (
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Delivery Fee</span>
                  <span>+ {formatPHPShort(delivery)}</span>
                </div>
              )}
              {setup > 0 && (
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Setup Fee</span>
                  <span>+ {formatPHPShort(setup)}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-2">
                <span className="text-lg font-bold">TOTAL</span>
                <span className="text-2xl font-bold text-gold-400">{formatPHPShort(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 4: GENERATE ============ */}
        {step === 3 && (
          <div className="space-y-4">
            <QuotePreview quote={buildQuoteData()} />

            <div className="grid grid-cols-2 gap-3">
              <BigButton onClick={sharePdf} disabled={busy === 'pdf'}>
                {busy === 'pdf' ? 'Creating…' : '📤 Share PDF'}
              </BigButton>
              <BigButton variant="navy" onClick={savePdf} disabled={busy === 'savepdf'}>
                {busy === 'savepdf' ? 'Saving…' : '💾 Save PDF'}
              </BigButton>
              <BigButton variant="outline" onClick={shareImage} disabled={busy === 'image'}>
                {busy === 'image' ? 'Creating…' : '📤 Share Image'}
              </BigButton>
              <BigButton variant="outline" onClick={saveImage} disabled={busy === 'saveimage'}>
                {busy === 'saveimage' ? 'Saving…' : '💾 Save Image'}
              </BigButton>
            </div>
            <BigButton variant="outline" onClick={startNew}>
              ➕ Start New Quotation
            </BigButton>

            {saved && (
              <p className="rounded-2xl border-2 border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold break-words text-green-700">
                ✓ Saved to your quotations
              </p>
            )}
            {saveMsg && (
              <p className="rounded-2xl border-2 border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold break-words text-green-700">
                ✓ {saveMsg}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold break-words text-red-700">
            {error}
          </p>
        )}

        {/* Bottom action */}
        {step < 3 && (
          <div className="mt-6">
            <BigButton onClick={next}>{step === 2 ? 'Review Done — Continue' : 'Next'}</BigButton>
          </div>
        )}
      </div>

      {/* Hidden A4-width copy used for image export (document-shaped PNG) */}
      {step === 3 && (
        <div aria-hidden="true" style={{ position: 'fixed', left: -10000, top: 0, width: 794, pointerEvents: 'none' }}>
          <QuotePreview quote={buildQuoteData()} id="quote-preview-export" />
        </div>
      )}

      {/* Modals */}
      {builderOpen && (
        <PackageBuilder catalog={catalog} onSave={savePackage} onClose={() => setBuilderOpen(false)} />
      )}

      {editLine && (
        <Modal
          title="Edit Item"
          onClose={() => setEditLine(null)}
          footer={
            <div className="space-y-2">
              <BigButton onClick={() => setEditLine(null)}>Done</BigButton>
              <BigButton
                variant="danger"
                onClick={() => {
                  removeLine(editLine.id)
                  setEditLine(null)
                }}
              >
                🗑 Remove item
              </BigButton>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-lg font-bold break-words text-navy-900">{editLine.name}</p>
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-navy-700">Quantity</span>
              <Stepper
                value={editLine.qty}
                min={1}
                onChange={(q) => {
                  updateLine(editLine.id, { qty: q })
                  setEditLine({ ...editLine, qty: q })
                }}
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-bold tracking-wide text-navy-700 uppercase">Unit price</p>
              <MoneyInput
                value={editLine.unitPrice}
                onChange={(v) => {
                  updateLine(editLine.id, { unitPrice: v })
                  setEditLine({ ...editLine, unitPrice: v })
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {customLineOpen && (
        <Modal
          title="Custom Item"
          onClose={() => setCustomLineOpen(false)}
          footer={<BigButton onClick={addCustomLine}>Add to Quotation</BigButton>}
        >
          <div className="space-y-4">
            <Field label="Item name">
              <input
                className={inputClass}
                placeholder="e.g. Bubble Machine"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                autoFocus
              />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-bold tracking-wide text-navy-700 uppercase">Price</p>
              <MoneyInput value={customPrice} onChange={setCustomPrice} />
            </div>
          </div>
        </Modal>
      )}

      {exitConfirm && (
        <Modal
          title="Cancel this quotation?"
          onClose={() => setExitConfirm(false)}
          footer={
            <div className="space-y-2">
              <BigButton variant="outline" onClick={() => setExitConfirm(false)}>
                Keep Editing
              </BigButton>
              <BigButton
                variant="danger"
                onClick={() => {
                  setExitConfirm(false)
                  navigate('/')
                }}
              >
                Cancel Quotation
              </BigButton>
            </div>
          }
        >
          <p className="text-base text-navy-700">Your changes will not be saved.</p>
        </Modal>
      )}
    </div>
  )
}
