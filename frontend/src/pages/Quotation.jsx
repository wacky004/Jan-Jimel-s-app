import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from 'lucide-react'
import api from '../api'
import { Button, FormErrorSummary, InlineAlert } from '../components/ui'
import { AdditionalNotes, ContactDetails, EventDetails, Review } from '../components/quotation/Details'
import { Catalog, OtherEquipment, SelectedEquipment } from '../components/quotation/Equipment'
import LeaveGuard from '../components/quotation/LeaveGuard'
import PriceList from '../components/quotation/PriceList'
import { buildPayload, fieldStep, groupCatalog, initialForm, steps, validQuantity, validateContact, validateEvent } from '../components/quotation/quotationData'
import '../components/quotation/quotation.css'

export default function Quotation() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ ...initialForm })
  const [selected, setSelected] = useState({})
  const [others, setOthers] = useState([])
  const [otherName, setOtherName] = useState('')
  const [otherQty, setOtherQty] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [catalog, setCatalog] = useState({ status: 'loading', items: [] })
  const [attempt, setAttempt] = useState(0)
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [focusRequest, setFocusRequest] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const submittingRef = useRef(false)
  const heading = useRef(null)
  const handledFocus = useRef(null)

  useEffect(() => {
    let active = true
    api.get('/quotations/public/items/').then(({ data }) => {
      if (!Array.isArray(data)) throw new Error('Invalid catalog response')
      if (active) setCatalog({ status: 'loaded', items: data })
    }).catch(() => { if (active) setCatalog((previous) => ({ ...previous, status: 'error' })) })
    return () => { active = false }
  }, [attempt])
  useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start' }) }, [step, done])
  useEffect(() => {
    if (!focusRequest || focusRequest === handledFocus.current || submitting) return
    const field = document.getElementById(focusRequest.id)
    if (field) {
      field.focus(); field.scrollIntoView({ block: 'center' })
      handledFocus.current = focusRequest
    }
  }, [focusRequest, step, submitting])
  const grouped = useMemo(() => groupCatalog(catalog.items), [catalog.items])
  const dirty = !done && (Object.values(form).some(Boolean) || Object.keys(selected).length > 0 || others.length > 0 || Boolean(otherName) || String(otherQty) !== '1')
  const set = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }))
  const focusInvalid = (nextErrors) => setFocusRequest({ id: `quote-${Object.keys(nextErrors)[0]}` })
  const showErrors = (nextErrors, destination = step) => {
    setErrors(nextErrors); setStep(destination); focusInvalid(nextErrors)
  }
  const remove = (id) => setSelected((value) => { const next = { ...value }; delete next[id]; return next })
  const toggle = (id) => setSelected((value) => { const next = { ...value }; if (Object.hasOwn(next, id)) delete next[id]; else next[id] = 1; return next })
  const changeQuantity = (id, qty) => setSelected((value) => ({ ...value, [id]: qty }))
  const addOther = () => {
    const nextErrors = {}
    if (!otherName.trim()) nextErrors.other_name = 'Enter the equipment name.'
    if (!validQuantity(otherQty)) nextErrors.other_qty = 'Enter a whole quantity of at least 1.'
    if (Object.keys(nextErrors).length) { showErrors(nextErrors); return }
    setOthers((value) => [...value, { name: otherName.trim(), qty: Math.max(1, Number(otherQty) || 1) }])
    setOtherName(''); setOtherQty(1); setErrors({})
    document.getElementById('quote-other_name')?.focus()
  }
  const equipmentErrors = () => {
    const next = {}
    for (const [id, qty] of Object.entries(selected)) if (!validQuantity(qty)) next[`quantity-${id}`] = 'Enter a whole quantity of at least 1.'
    if (otherName.trim()) next.other_name = 'Select Add equipment to include this entry, or clear its name before continuing.'
    return next
  }
  const goBack = (destination) => { setStep(destination); setErrors({}); setFailure('') }

  const submit = async (event) => {
    event.preventDefault()
    if (submittingRef.current) return
    setFailure('')
    const eventErrors = validateEvent(form)
    if (Object.keys(eventErrors).length) { showErrors(eventErrors, 0); return }
    if (step === 0) { setErrors({}); setStep(1); return }
    const itemErrors = equipmentErrors()
    if (Object.keys(itemErrors).length) { showErrors(itemErrors, 1); return }
    if (step === 1) { setErrors({}); setStep(2); return }
    const contactErrors = validateContact(form, document.getElementById('quote-email')?.validity.valid)
    if (Object.keys(contactErrors).length) { showErrors(contactErrors, 2); return }
    setErrors({})
    const payload = buildPayload(form, selected, others, catalog.items)
    submittingRef.current = true; setSubmitting(true)
    try {
      await api.post('/quotations/public/submit/', payload)
      setDone(true)
    } catch (error) {
      const fieldErrors = {}
      if (error.response?.status === 400 && error.response.data && typeof error.response.data === 'object') {
        for (const key of ['event_type', 'event_date', 'venue', 'items_requested', 'name', 'phone', 'email']) {
          const value = error.response.data[key]
          if (value) fieldErrors[key] = Array.isArray(value) ? value.join(' ') : String(value)
        }
      }
      if (Object.keys(fieldErrors).length) {
        const first = Object.keys(fieldErrors)[0]
        showErrors(fieldErrors, fieldStep(first))
      } else {
        setFailure(error.response?.status === 429 ? 'Too many requests. Please wait before trying again, or call 0908-950-3879. Your details are still here.' : 'Your request could not be confirmed. Your details are still here. Please try again or call 0908-950-3879.')
        setFocusRequest({ id: 'quote-submit-error' })
      }
    } finally { submittingRef.current = false; setSubmitting(false) }
  }

  return <div className="quote-page">
    <LeaveGuard dirty={dirty} submitting={submitting} />
    <div className="quote-shell"><header className="quote-intro"><p className="quote-eyebrow">Jan &amp; Jimels Party Needs</p><h1>Let’s plan your celebration.</h1><p>Share your plans, choose your equipment and send a quotation request. We’ll contact you about pricing and availability.</p></header>
      {done ? <section className="quote-card quote-success"><CheckCircle2 size={44} aria-hidden="true" /><h2 ref={heading} tabIndex={-1}>Request sent!</h2><p>Salamat, {form.name}! Your quotation request has been received.</p><p>Our team will use {form.phone.trim() ? form.phone : form.email} to discuss your request. Review the quotation and confirm the booking details with us before your event.</p><p>For urgent questions, <a href="tel:09089503879">call 0908-950-3879</a>.</p><Link className="public-action public-action-gold" to="/">Back to Home</Link></section> : <>
        <nav aria-label="Quotation progress"><ol className="quote-progress">{steps.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined}><span aria-hidden="true">{index + 1}</span>{index < step ? <button type="button" disabled={submitting} onClick={() => goBack(index)}>{label}</button> : <span>{label}</span>}</li>)}</ol></nav>
        <form className="quote-card" noValidate onSubmit={submit} aria-busy={submitting || undefined}>
          <p className="quote-eyebrow" role="status" aria-live="polite" aria-atomic="true">Step {step + 1} of 3: {steps[step]}</p>
          <h2 ref={heading} tabIndex={-1} className="quote-step-title">{steps[step]}</h2>
          <FormErrorSummary errors={Object.entries(errors).map(([key, message]) => ({ fieldId: `quote-${key}`, message }))} onFieldFocus={(id) => { const key = id.slice(6); setStep(fieldStep(key)); focusInvalid({ [key]: errors[key] }) }} />
          {failure && <div id="quote-submit-error" tabIndex={-1}><InlineAlert tone="error" title="Request not confirmed">{failure}</InlineAlert></div>}
          <fieldset disabled={submitting} className="quote-step-fields">
            {step === 0 && <EventDetails form={form} set={set} errors={errors} />}
            {step === 1 && <>
              <Catalog catalog={catalog} search={search} setSearch={setSearch} category={category} setCategory={setCategory} selected={selected} toggle={toggle} retry={() => { setCatalog((value) => ({ ...value, status: 'loading' })); setAttempt((value) => value + 1) }} />
              <SelectedEquipment selected={selected} items={catalog.items} changeQuantity={changeQuantity} remove={remove} errors={errors} />
              <OtherEquipment others={others} name={otherName} quantity={otherQty} setName={setOtherName} setQuantity={setOtherQty} add={addOther} remove={(index) => setOthers((value) => value.filter((_, i) => i !== index))} errors={errors} />
              <AdditionalNotes form={form} set={set} errors={errors} />
            </>}
            {step === 2 && <><ContactDetails form={form} set={set} errors={errors} /><Review form={form} selected={selected} others={others} items={catalog.items} /></>}
          </fieldset>
          {submitting && <p role="status">Sending your request. Please wait for confirmation.</p>}
          <div className="quote-step-actions">{step > 0 && <Button variant="secondary" disabled={submitting} onClick={() => goBack(step - 1)}><ArrowLeft size={18} aria-hidden="true" />Back</Button>}<Button type="submit" variant="conversion" busy={submitting} busyLabel="Sending your request…">{step === 2 ? <><Send size={18} aria-hidden="true" />Submit quotation request</> : <>Next: {steps[step + 1]}<ArrowRight size={18} aria-hidden="true" /></>}</Button></div>
        </form>
        <PriceList grouped={grouped} status={catalog.status} />
      </>}
    </div>
  </div>
}
