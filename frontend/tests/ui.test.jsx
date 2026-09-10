import { StrictMode, useRef, useState } from 'react'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { Button, CheckboxField, ConfirmationDialog, Dialog, Drawer, FormErrorSummary, IconButton, SelectField, TextareaField, TextField, ToastRegion } from '../src/components/ui'
import RouteFocus from '../src/components/RouteFocus'

describe('shared fields and feedback', () => {
  it('associates labels, hints and errors, preserves native controls and forwarded refs', async () => {
    const user = userEvent.setup()
    const ref = { current: null }
    render(<><TextField ref={ref} label="Customer" hint="Full name" error="Name required" required /><TextareaField label="Notes" /><SelectField label="Category"><option>Chairs</option><option>Tables</option></SelectField><CheckboxField label="Setup needed" hint="Optional" /></>)
    const input = screen.getByLabelText('Customer *')
    expect(ref.current).toBe(input)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const ids = input.getAttribute('aria-describedby').split(' ')
    expect(ids.map((id) => document.getElementById(id).textContent)).toEqual(['Full name', 'Name required'])
    await user.type(input, 'Example')
    await user.type(screen.getByLabelText('Notes'), 'Test')
    await user.selectOptions(screen.getByLabelText('Category'), 'Tables')
    screen.getByLabelText('Setup needed').focus()
    await user.keyboard(' ')
    expect(screen.getByLabelText('Setup needed').checked).toBe(true)
    expect(screen.getByLabelText('Category').value).toBe('Tables')
  })

  it('defaults to non-submit actions and blocks duplicate busy actions', async () => {
    const user = userEvent.setup()
    const submit = vi.fn((event) => event.preventDefault())
    const action = vi.fn()
    render(<form onSubmit={submit}><Button onClick={action}>Action</Button><Button busy onClick={action}>Busy</Button><IconButton label="Search">S</IconButton><Button type="submit">Save</Button></form>)
    screen.getByRole('button', { name: 'Action' }).focus()
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Busy' }))
    expect(action).toHaveBeenCalledTimes(1)
    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Search' }).type).toBe('button')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('focuses a new error summary and its field link', async () => {
    const user = userEvent.setup()
    render(<><TextField id="name" label="Name" /><FormErrorSummary focus errors={[{ fieldId: 'name', message: 'Name required' }]} /></>)
    expect(document.activeElement).toBe(screen.getByRole('alert'))
    await user.click(screen.getByRole('link', { name: 'Name required' }))
    expect(document.activeElement).toBe(screen.getByLabelText('Name'))
  })

  it('keeps a polite toast region mounted and supports dismissal', async () => {
    const dismiss = vi.fn()
    const { rerender } = render(<ToastRegion />)
    expect(screen.getByRole('region', { name: 'Notifications' }).querySelector('[aria-live="polite"]')).not.toBeNull()
    rerender(<ToastRegion toasts={[{ id: 1, title: 'Saved', message: 'Done' }]} onDismiss={dismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss Saved' }))
    expect(dismiss).toHaveBeenCalledWith(1)
  })
})

function OverlayExample({ drawer = false }) {
  const [open, setOpen] = useState(false)
  const [nested, setNested] = useState(false)
  const inputRef = useRef(null)
  const Overlay = drawer ? Drawer : Dialog
  return <><Button onClick={() => setOpen(true)}>Open</Button>
    <Overlay open={open} onClose={() => setOpen(false)} title="Editor" description="Edit the example" initialFocusRef={inputRef}
      footer={<Button onClick={() => setOpen(false)}>Done</Button>}>
      <TextField label="Dialog field" ref={inputRef} /><Button onClick={() => setNested(true)}>Nested</Button>
    </Overlay>
    <ConfirmationDialog open={nested} onClose={() => setNested(false)} onConfirm={() => setNested(false)} title="Confirm edit" description="Confirm only this example" />
  </>
}

describe('overlay focus lifecycle', () => {
  it('sets initial focus, wraps Tab/Shift+Tab, handles cancel and restores trigger under StrictMode', async () => {
    const user = userEvent.setup()
    render(<StrictMode><OverlayExample /></StrictMode>)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Editor' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(dialog.getAttribute('aria-describedby')).textContent).toBe('Edit the example')
    expect(document.activeElement).toBe(screen.getByLabelText('Dialog field'))
    screen.getByRole('button', { name: 'Done' }).focus()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close dialog' }))
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Done' }))
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    expect(document.body.style.overflow).toBe('')
  })

  it('keeps the parent locked and restores nested focus in the correct order', async () => {
    const user = userEvent.setup()
    render(<OverlayExample />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const nestedTrigger = screen.getByRole('button', { name: 'Nested' })
    await user.click(nestedTrigger)
    const confirmation = screen.getByRole('dialog', { name: 'Confirm edit' })
    expect(document.activeElement).toBe(within(confirmation).getByRole('button', { name: 'Cancel' }))
    await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }))
    expect(document.activeElement).toBe(nestedTrigger)
    expect(document.body.style.overflow).toBe('hidden')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open' }))
  })

  it('keeps a busy confirmation open and restores scroll on unmount', () => {
    const close = vi.fn()
    const confirm = vi.fn()
    const { unmount } = render(<ConfirmationDialog open busy title="Confirm" description="Working" onClose={close} onConfirm={confirm} />)
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(close).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Working…' }).disabled).toBe(true)
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('gives drawers the same dialog semantics and restoration', async () => {
    const user = userEvent.setup()
    render(<OverlayExample drawer />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('dialog').className).toContain('ui-drawer')
    expect(document.activeElement).toBe(screen.getByLabelText('Dialog field'))
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open' }))
  })
})

it('focuses arriving route content and ignores query-only filter changes', async () => {
  function RoutesExample({ ready }) {
    const navigate = useNavigate()
    return <><RouteFocus /><Button onClick={() => navigate('/admin/orders?status=pending')}>Filter</Button><Button onClick={() => navigate('/admin/inventory')}>Inventory</Button>{ready && <main id="main-content" tabIndex={-1}>Content</main>}</>
  }
  const { rerender } = render(<MemoryRouter initialEntries={['/admin/orders']}><RoutesExample ready={false} /></MemoryRouter>)
  rerender(<MemoryRouter initialEntries={['/admin/orders']}><RoutesExample ready /></MemoryRouter>)
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')))
  await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Filter' }))
  await userEvent.click(screen.getByRole('button', { name: 'Inventory' }))
  expect(document.activeElement).toBe(screen.getByRole('main'))
})

it('keeps semantic text/action pairs at AA contrast and motion within 150–300ms', () => {
  const css = readFileSync(`${import.meta.dirname}/../src/index.css`, 'utf8')
  const root = css.slice(css.lastIndexOf(':root {')).split('}')[0]
  const tokens = Object.fromEntries([...root.matchAll(/(--ui-[\w-]+): (#[\da-f]{6});/g)].map((m) => [m[1], m[2]]))
  const luminance = (hex) => hex.slice(1).match(/../g).map((v) => parseInt(v, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, index) => sum + v * [0.2126, 0.7152, 0.0722][index], 0)
  const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05)
  const pairs = [['text-primary','surface-card'],['text-secondary','surface-page'],['text-gold','surface-card'],['text-gold','surface-page'],['text-inverse-secondary','surface-inverse']]
  for (const action of ['primary','conversion','secondary','danger']) pairs.push([`action-${action}-text`,`action-${action}`], [`action-${action}-text`,`action-${action}-hover`])
  for (const tone of ['success','warning','error','info']) pairs.push([`${tone}-text`,`${tone}-surface`])
  for (const [a,b] of pairs) expect(contrast(tokens[`--ui-${a}`], tokens[`--ui-${b}`]), `${a} on ${b}`).toBeGreaterThanOrEqual(4.5)
  for (const match of css.matchAll(/--ui-duration-\w+: (\d+)ms/g)) expect(Number(match[1])).toBeGreaterThanOrEqual(150)
  for (const match of css.matchAll(/--ui-duration-\w+: (\d+)ms/g)) expect(Number(match[1])).toBeLessThanOrEqual(300)
  expect(css).toContain('@media (prefers-reduced-motion: reduce)')
})
