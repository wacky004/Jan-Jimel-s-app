import { useEffect, useId, useRef } from 'react'
import { AlertCircle, CheckCircle2, CircleAlert, Inbox, Info, LoaderCircle, X } from 'lucide-react'

const cx = (...values) => values.filter(Boolean).join(' ')
const toneIcons = { success: CheckCircle2, warning: CircleAlert, error: AlertCircle, info: Info }

export function Button({ variant = 'primary', busy = false, busyLabel, disabled, type = 'button', className, children, ...props }) {
  return (
    <button {...props} type={type} disabled={disabled || busy} aria-busy={busy || undefined}
      className={cx('ui-button', className)} data-variant={variant}>
      {busy && <LoaderCircle size={18} aria-hidden="true" />}
      {busy && busyLabel ? busyLabel : children}
    </button>
  )
}

export function IconButton({ label, children, className, ...props }) {
  return <Button variant="ghost" {...props} aria-label={label} title={label} className={cx('ui-icon-button', className)}>{children}</Button>
}

export function FieldError({ id, children }) {
  return children ? <p id={id} className="ui-field-error">{children}</p> : null
}

function Field({ as: Control = 'input', id, label, hint, error, className, controlClassName, tone, children, ...props }) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const describedBy = cx(props['aria-describedby'], hint && `${fieldId}-hint`, error && `${fieldId}-error`) || undefined
  return (
    <div className={cx('ui-field', className)} data-tone={tone}>
      <label className="ui-label" htmlFor={fieldId}>{label}{props.required && <span aria-hidden="true"> *</span>}</label>
      <Control {...props} id={fieldId} className={cx('ui-control', controlClassName)}
        aria-invalid={error ? true : props['aria-invalid']} aria-describedby={describedBy}>{children}</Control>
      {hint && <p id={`${fieldId}-hint`} className="ui-field-hint">{hint}</p>}
      <FieldError id={`${fieldId}-error`}>{error}</FieldError>
    </div>
  )
}

export function TextField(props) { return <Field {...props} as="input" /> }
export function SelectField(props) { return <Field {...props} as="select" /> }
export function TextareaField(props) { return <Field rows={4} {...props} as="textarea" /> }

export function CheckboxField({ id, label, hint, error, className, ...props }) {
  const generatedId = useId()
  const fieldId = id || generatedId
  return (
    <div className={cx('ui-field', className)}>
      <label className="ui-checkbox-label" htmlFor={fieldId}>
        <input {...props} id={fieldId} type="checkbox" className="ui-checkbox"
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={cx(props['aria-describedby'], hint && `${fieldId}-hint`, error && `${fieldId}-error`) || undefined} />
        <span>{label}{props.required && <span aria-hidden="true"> *</span>}</span>
      </label>
      {hint && <p id={`${fieldId}-hint`} className="ui-field-hint">{hint}</p>}
      <FieldError id={`${fieldId}-error`}>{error}</FieldError>
    </div>
  )
}

export function FormErrorSummary({ id, errors = [], title = 'Please check the following', focus = false }) {
  const ref = useRef(null)
  const headingId = useId()
  const hasErrors = errors.length > 0
  useEffect(() => { if (focus && hasErrors) ref.current?.focus() }, [focus, hasErrors])
  if (!hasErrors) return null
  return (
    <div id={id} ref={ref} role="alert" tabIndex={-1} aria-labelledby={headingId} className="ui-alert" data-tone="error">
      <h3 id={headingId} className="ui-alert-title">{title}</h3>
      <ul className="ui-error-list">
        {errors.map(({ fieldId, message }, index) => (
          <li key={`${fieldId || 'form'}-${index}`}>
            {fieldId ? <a href={`#${fieldId}`} onClick={(event) => {
              const field = document.getElementById(fieldId)
              if (field) { event.preventDefault(); field.focus(); field.scrollIntoView({ block: 'center' }) }
            }}>{message}</a> : message}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function InlineAlert({ tone = 'info', title, children, action, announce = true, className }) {
  const Icon = toneIcons[tone] || Info
  return (
    <div className={cx('ui-alert', className)} data-tone={tone} role={announce ? (tone === 'error' ? 'alert' : 'status') : undefined}>
      <div className="ui-alert-layout">
        <Icon size={20} aria-hidden="true" />
        <div>{title && <p className="ui-alert-title">{title}</p>}{children && <div>{children}</div>}{action && <div className="ui-state-action">{action}</div>}</div>
      </div>
    </div>
  )
}

const statusTones = { pending: 'warning', confirmed: 'info', out_for_delivery: 'info', delivered: 'success', completed: 'neutral', cancelled: 'error', new: 'warning', replied: 'info', closed: 'neutral' }

export function StatusBadge({ status = '', label, className }) {
  return <span className={cx('ui-status-badge', className)} data-tone={statusTones[status] || 'neutral'}>{label || status.replaceAll('_', ' ')}</span>
}

export function LoadingSkeleton({ label = 'Loading…', lines = 3, className }) {
  return (
    <div className={cx('ui-skeleton', className)} role="status" aria-busy="true">
      <span className="ui-sr-only">{label}</span>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => <div key={index} className="ui-skeleton-line" aria-hidden="true" />)}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', children, action, icon: Icon = Inbox }) {
  return <div className="ui-empty-state"><Icon size={28} aria-hidden="true" /><h3>{title}</h3>{children && <p>{children}</p>}{action && <div className="ui-state-action">{action}</div>}</div>
}

export function ErrorState({ title = 'Unable to load', children, onRetry, retrying = false }) {
  return <InlineAlert tone="error" title={title} action={onRetry && <Button variant="secondary" onClick={onRetry} busy={retrying} busyLabel="Retrying…">Try again</Button>}>{children}</InlineAlert>
}

export function ToastRegion({ toasts = [], onDismiss, label = 'Notifications' }) {
  return (
    <section className="ui-toast-region" aria-label={label}>
      <div aria-live="polite" aria-relevant="additions" aria-atomic="false">
        {toasts.map((toast) => <div key={toast.id} className="ui-toast">
          <InlineAlert tone={toast.tone || 'success'} title={toast.title} announce={false}>{toast.message}</InlineAlert>
          {onDismiss && <IconButton label={`Dismiss ${toast.title || 'notification'}`} onClick={() => onDismiss(toast.id)}><X size={18} aria-hidden="true" /></IconButton>}
        </div>)}
      </div>
    </section>
  )
}
