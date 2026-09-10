// Development-only Vite entry. Not imported into App or the production build.
import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Search } from 'lucide-react'
import { Button, IconButton, TextField, SelectField, TextareaField, CheckboxField, FormErrorSummary, InlineAlert, StatusBadge, LoadingSkeleton, EmptyState, ErrorState, ToastRegion, Dialog, ConfirmationDialog, Drawer } from '../src/components/ui'
import '../src/index.css'
import './ui-foundations.css'

export default function Foundations() {
  const [dialog, setDialog] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [errors, setErrors] = useState([])
  const [toasts, setToasts] = useState([])
  const initialRef = useRef(null)
  const toastId = useRef(0)
  const notify = () => setToasts((items) => [...items, { id: ++toastId.current, title: 'Example saved', message: 'This example does not send any data.' }])
  return <>
    <a className="ui-skip-link" href="#main-content">Skip to main content</a>
    <main id="main-content" tabIndex={-1} className="foundation-examples">
      <header><p className="foundation-eyebrow">Jan &amp; Jimels · Phase 1</p><h1>UI foundations</h1><p>Development examples only. These controls do not call business APIs.</p></header>
      <section><h2>Actions</h2><div className="foundation-row">{['primary', 'conversion', 'secondary', 'ghost', 'danger'].map((variant) => <Button key={variant} variant={variant} onClick={notify}>{variant}</Button>)}<IconButton label="Example search" onClick={notify}><Search size={20} aria-hidden="true" /></IconButton><Button busy busyLabel="Saving…">Save</Button><Button disabled>Disabled</Button></div></section>
      <section><h2>Form controls</h2><form noValidate onSubmit={(event) => {
        event.preventDefault()
        const name = new FormData(event.currentTarget).get('example-name')
        if (!String(name).trim()) setErrors([{ fieldId: 'example-name', message: 'Enter a name for this example.' }])
        else { setErrors([]); notify() }
      }}>
        <FormErrorSummary errors={errors} focus />
        <div className="foundation-grid">
          <TextField id="example-name" name="example-name" label="Name" required hint="Use a fictional name." error={errors[0]?.message} />
          <SelectField id="example-select" label="Event type" defaultValue=""><option value="">Choose an event</option><option>Birthday</option><option>Wedding</option></SelectField>
          <TextareaField id="example-notes" label="Notes" hint="No customer information is needed." />
          <CheckboxField id="example-check" label="Include setup instructions" hint="Native checkbox with a clickable label." />
        </div><Button type="submit" variant="conversion">Validate example</Button>
      </form></section>
      <section><h2>Feedback</h2><div className="foundation-grid">{['success', 'warning', 'error', 'info'].map((tone) => <InlineAlert key={tone} tone={tone} title={`${tone} example`} announce={false}>Use clear, specific guidance and retain form data.</InlineAlert>)}</div><div className="foundation-row">{['pending','confirmed','out_for_delivery','delivered','completed','cancelled','new','replied','closed'].map((status) => <StatusBadge key={status} status={status} />)}</div><div className="foundation-grid"><LoadingSkeleton label="Loading example items" /><EmptyState title="No items yet" action={<Button onClick={notify}>Add example</Button>}>Explain the next useful action.</EmptyState><EmptyState title="No matches" action={<Button variant="secondary" onClick={notify}>Clear filters</Button>}>Try another search or clear your filters.</EmptyState><ErrorState onRetry={notify}>A retry is safe for this example.</ErrorState></div></section>
      <section><h2>Dialogs and sheets</h2><div className="foundation-row"><Button onClick={() => setDialog(true)}>Open dialog</Button><Button variant="danger" onClick={() => setConfirm(true)}>Open confirmation</Button><Button variant="secondary" onClick={() => setDrawer(true)}>Open drawer</Button></div></section>
      <section className="foundation-inverse"><h2>Inverse surface</h2><TextField label="Inverse field" tone="inverse" hint="Readable text and visible focus on navy." /><p className="foundation-gold-light">Light gold is for inverse surfaces.</p></section>
    </main>
    <Dialog open={dialog} onClose={() => setDialog(false)} title="Example dialog" description="Tab remains inside; Escape closes and restores focus." initialFocusRef={initialRef} footer={<Button onClick={() => setDialog(false)}>Done</Button>}>
      <TextField ref={initialRef} label="Dialog name" /><Button variant="secondary" onClick={() => setConfirm(true)}>Nested confirmation</Button>
    </Dialog>
    <ConfirmationDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => { setConfirm(false); notify() }} title="Remove the example?" description="Only demonstration state is affected." confirmLabel="Remove example" />
    <Drawer open={drawer} onClose={() => setDrawer(false)} title="Example drawer" description="Shares the dialog keyboard behavior."><TextField label="Search this drawer" /><Button onClick={() => setDrawer(false)}>Done</Button></Drawer>
    <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))} />
  </>
}

createRoot(document.getElementById('root')).render(<StrictMode><Foundations /></StrictMode>)
