import { useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button, IconButton } from './primitives'

let scrollLocks = 0
let savedOverflow = ''

function lockScroll() {
  if (scrollLocks++ === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  return () => { if (--scrollLocks === 0) document.body.style.overflow = savedOverflow }
}

function focusableElements(dialog) {
  return [...dialog.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
    .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[hidden], [inert]') && element.getClientRects().length > 0)
}

export function Dialog({ open, onClose, title, description, children, footer, initialFocusRef, dismissible = true, closeOnBackdrop = false, closeLabel = 'Close dialog', onKeyDown: handleKeyDown, className = '', id, ...props }) {
  const ref = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useLayoutEffect(() => {
    if (!open) return
    const dialog = ref.current
    const trigger = document.activeElement
    // Native modal top-layer behavior makes everything outside the dialog inert.
    dialog.showModal()
    const unlock = lockScroll()
    const requested = initialFocusRef?.current
    const target = requested && dialog.contains(requested) && !requested.matches(':disabled') && requested.getClientRects().length
      ? requested : focusableElements(dialog)[0]
    ;(target || dialog).focus({ preventScroll: true })
    return () => {
      dialog.close()
      unlock()
      if (trigger?.isConnected && !trigger.closest('[inert]')) trigger.focus({ preventScroll: true })
    }
  }, [open, initialFocusRef])

  const onKeyDown = (event) => {
    handleKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key !== 'Tab') return
    const items = focusableElements(ref.current)
    const first = items[0]
    const last = items.at(-1)
    const active = document.activeElement
    if (!first) { event.preventDefault(); ref.current.focus(); return }
    if (event.shiftKey && (active === first || active === ref.current)) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && (active === last || active === ref.current)) { event.preventDefault(); first.focus() }
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    <dialog {...props} ref={ref} id={id} role="dialog" aria-modal="true" aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={`ui-dialog ${className}`}
      onKeyDown={onKeyDown} onCancel={(event) => { event.preventDefault(); if (dismissible) onClose() }}
      onClick={(event) => {
        if (!closeOnBackdrop || !dismissible || event.target !== event.currentTarget) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
      }}>
      {open && <>
        <header className="ui-dialog-header">
          <div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div>
          <IconButton label={closeLabel} disabled={!dismissible} onClick={onClose}><X size={20} aria-hidden="true" /></IconButton>
        </header>
        <div className="ui-dialog-body">{children}</div>
        {footer && <footer className="ui-dialog-footer">{footer}</footer>}
      </>}
    </dialog>, document.body,
  )
}

export function ConfirmationDialog({ open, onClose, onConfirm, title, description, children, confirmLabel = 'Confirm', cancelLabel = 'Cancel', busy = false, variant = 'danger' }) {
  const cancelRef = useRef(null)
  return <Dialog open={open} onClose={onClose} title={title} description={description} initialFocusRef={cancelRef} dismissible={!busy}
    footer={<><Button ref={cancelRef} variant="secondary" disabled={busy} onClick={onClose}>{cancelLabel}</Button><Button variant={variant} busy={busy} busyLabel="Working…" onClick={onConfirm}>{confirmLabel}</Button></>}>
    {children}
  </Dialog>
}

export function Drawer({ side = 'right', className = '', ...props }) {
  return <Dialog {...props} className={`ui-drawer ${className}`} data-side={side} />
}
