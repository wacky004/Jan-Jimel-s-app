import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, Link, Route, RouterProvider, Routes } from 'react-router-dom'
import Quotation from '../src/pages/Quotation'
import { buildPayload, groupCatalog, initialForm, PRICELIST_GROUPS } from '../src/components/quotation/quotationData'
import { downloadPricelist } from '../src/components/quotation/downloadPricelist'
import api from '../src/api'

const pdf = vi.hoisted(() => ({ text: vi.fn(), save: vi.fn(), addPage: vi.fn(), setFontSize: vi.fn(), setTextColor: vi.fn(), setDrawColor: vi.fn(), line: vi.fn() }))
vi.mock('jspdf', () => ({ jsPDF: class { constructor() { return pdf } } }))
vi.mock('../src/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
const catalog = [
  { id: 2, name: 'White chair', category: 'Chairs', rental_price: '25.00', color: 'White', size: '', photo_url: '/images/logo.jpg', quantity_on_hand: 777, notes: 'Private inventory note' },
  { id: 1, name: 'Round table', category: 'Tables', rental_price: '100.00', color: '', size: 'Round', photo_url: '' },
]
let router
let width
beforeEach(() => {
  width = 375
  vi.stubGlobal('matchMedia', () => ({ get matches() { return width >= 768 }, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(callback, 0))
  vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id))
  vi.mocked(api.get).mockReset().mockResolvedValue({ data: catalog })
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: { id: 1 } })
  Object.values(pdf).forEach((mock) => mock.mockClear())
})
afterEach(() => { router?.dispose(); vi.unstubAllGlobals() })
function start() {
  // Mirrors App's data router around its unchanged descendant route definitions.
  router = createMemoryRouter([{ path: '*', element: <><Link to="/">Home link</Link><Routes><Route path="/" element={<h1>Home page</h1>} /><Route path="/quote" element={<Quotation />} /></Routes></> }], { initialEntries: ['/', '/quote'], initialIndex: 1 })
  render(<RouterProvider router={router} />)
}
async function equipment() { await userEvent.click(screen.getByRole('button', { name: 'Next: Equipment selection' })) }
async function review() { await userEvent.click(screen.getByRole('button', { name: 'Next: Contact details and review' })) }
async function send() { await userEvent.click(screen.getByRole('button', { name: 'Submit quotation request' })) }

it('retains all steps and posts the exact legacy payload with catalog, custom and free-text lines', async () => {
  const user = userEvent.setup(); start()
  await user.selectOptions(screen.getByLabelText('Event type'), 'Birthday')
  fireEvent.change(screen.getByLabelText('Event date'), { target: { value: '2026-12-01' } })
  await user.type(screen.getByLabelText('Venue / location'), 'Cainta hall')
  await equipment()
  await user.click(await screen.findByRole('checkbox', { name: 'White chair' }))
  await user.click(screen.getByRole('button', { name: 'Increase quantity for White chair' }))
  await user.click(screen.getByRole('checkbox', { name: 'Round table' }))
  await user.type(screen.getByLabelText('Search equipment'), 'missing')
  expect(screen.getByText('No matching equipment')).not.toBeNull()
  expect(screen.getByLabelText('Quantity for White chair').value).toBe('2')
  await user.click(screen.getByRole('button', { name: 'Clear search and category' }))
  await user.type(screen.getByLabelText('Other equipment name'), 'Bubble machine')
  await user.clear(screen.getByLabelText('Other equipment quantity'))
  await user.type(screen.getByLabelText('Other equipment quantity'), '3')
  await user.click(screen.getByRole('button', { name: 'Add equipment' }))
  await user.type(screen.getByLabelText('Additional notes / specific requests'), 'Blue theme\nEvening setup')
  await review()
  await user.type(screen.getByRole('textbox', { name: /Full name/ }), 'Sample Customer')
  await user.type(screen.getByLabelText('Phone number'), '09080000000')
  const reviewSection = screen.getByRole('region', { name: 'Review your request' })
  expect(reviewSection.textContent).toContain('Bubble machine × 3')
  await user.click(screen.getByRole('button', { name: 'Back', exact: true }))
  expect(screen.getByLabelText('Quantity for White chair').value).toBe('2')
  expect(screen.getByLabelText('Additional notes / specific requests').value).toBe('Blue theme\nEvening setup')
  await user.click(screen.getByRole('button', { name: 'Back', exact: true }))
  expect(screen.getByLabelText('Venue / location').value).toBe('Cainta hall')
  expect(screen.getByLabelText('Event date').value).toBe('2026-12-01')
  await equipment(); await review()
  expect(screen.getByRole('textbox', { name: /Full name/ }).value).toBe('Sample Customer')
  await send()
  await screen.findByRole('heading', { name: 'Request sent!' })
  expect(api.get).toHaveBeenCalledWith('/quotations/public/items/')
  expect(api.post).toHaveBeenCalledExactlyOnceWith('/quotations/public/submit/', {
    name: 'Sample Customer', phone: '09080000000', email: '', event_type: 'Birthday', event_date: '2026-12-01', venue: 'Cainta hall',
    items_requested: 'Round table x1\nWhite chair x2\nOther equipment: Bubble machine x3\nBlue theme\nEvening setup', message: '',
  })
  await user.click(screen.getByRole('link', { name: 'Back to Home' }))
  expect(await screen.findByRole('heading', { name: 'Home page' })).not.toBeNull()
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('enforces name and phone-or-email, focuses the first invalid field and accepts email only', async () => {
  start(); await equipment(); await review(); await send()
  await waitFor(() => expect(document.activeElement.id).toBe('quote-name'))
  expect(screen.getByRole('alert').textContent).toContain('Enter your full name.')
  const name = screen.getByRole('textbox', { name: /Full name/ })
  expect(document.getElementById(name.getAttribute('aria-describedby')).textContent).toContain('Enter your full name.')
  await userEvent.type(name, 'Test Customer'); await send()
  await waitFor(() => expect(document.activeElement.id).toBe('quote-phone'))
  await userEvent.type(screen.getByLabelText('Email address'), 'invalid'); await send()
  await waitFor(() => expect(document.activeElement.id).toBe('quote-email'))
  expect(api.post).not.toHaveBeenCalled()
  await userEvent.clear(screen.getByLabelText('Email address'))
  await userEvent.type(screen.getByLabelText('Email address'), 'customer@example.com'); await send()
  await screen.findByRole('heading', { name: 'Request sent!' })
  expect(api.post.mock.calls[0][1]).toEqual({ ...initialForm, name: 'Test Customer', email: 'customer@example.com', event_date: null })
})

it('retains values on failed submission, reports progress, blocks duplicate sends and retries', async () => {
  let reject
  api.post.mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail }))
  start(); await equipment(); await review()
  await userEvent.type(screen.getByRole('textbox', { name: /Full name/ }), 'Test Customer')
  await userEvent.type(screen.getByLabelText('Phone number'), '09080000000')
  await send()
  expect(screen.getByRole('button', { name: 'Sending your request…' }).disabled).toBe(true)
  fireEvent.submit(screen.getByRole('button', { name: 'Sending your request…' }).closest('form'))
  expect(api.post).toHaveBeenCalledTimes(1)
  await act(async () => reject(new Error('Offline')))
  await waitFor(() => expect(document.activeElement.id).toBe('quote-submit-error'))
  expect(screen.getByRole('textbox', { name: /Full name/ }).value).toBe('Test Customer')
  expect(screen.getByLabelText('Phone number').value).toBe('09080000000')
  await send(); await screen.findByRole('heading', { name: 'Request sent!' })
  expect(api.post.mock.calls[0]).toEqual(api.post.mock.calls[1])
})

it('shows catalog loading/error/retry/empty, filters categories and excludes protected fields', async () => {
  let fail
  api.get.mockReturnValueOnce(new Promise((_resolve, reject) => { fail = reject }))
  start(); await equipment()
  expect(screen.getByText('Loading equipment catalog')).not.toBeNull()
  await act(async () => fail(new Error('Offline')))
  expect(screen.getByRole('alert').textContent).toContain('Equipment couldn’t be loaded')
  api.get.mockResolvedValueOnce({ data: [] })
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('No equipment listed yet')).not.toBeNull()
  expect(api.get.mock.calls).toEqual([['/quotations/public/items/'], ['/quotations/public/items/']])
})

it('filters display-label categories without removing selected items or revealing private data', async () => {
  start(); await equipment()
  await userEvent.click(await screen.findByRole('checkbox', { name: 'White chair' }))
  await userEvent.selectOptions(screen.getByLabelText('Category'), 'tables')
  expect(screen.queryByRole('checkbox', { name: 'White chair' })).toBeNull()
  expect(screen.getByRole('checkbox', { name: 'Round table' })).not.toBeNull()
  expect(screen.getByLabelText('Quantity for White chair')).not.toBeNull()
  expect(screen.queryByText('777')).toBeNull(); expect(screen.queryByText('Private inventory note')).toBeNull()
})

it('validates quantities and prevents silently abandoning an unadded custom entry', async () => {
  start(); await equipment()
  await userEvent.click(await screen.findByRole('checkbox', { name: 'White chair' }))
  await userEvent.clear(screen.getByLabelText('Quantity for White chair'))
  await review(); await waitFor(() => expect(document.activeElement.id).toBe('quote-quantity-2'))
  await userEvent.type(screen.getByLabelText('Quantity for White chair'), '5')
  await userEvent.type(screen.getByLabelText('Other equipment name'), 'Stage')
  await review(); await waitFor(() => expect(document.activeElement.id).toBe('quote-other_name'))
  expect(screen.getByLabelText('Other equipment name').value).toBe('Stage')
  await userEvent.click(screen.getByRole('button', { name: 'Add equipment' }))
  await review(); expect(screen.getByRole('region', { name: 'Review your request' }).textContent).toContain('Stage × 1')
})

it('warns on links and browser Back, retains the draft on cancel and leaves on confirmation', async () => {
  start(); await userEvent.type(screen.getByLabelText('Venue / location'), 'Unsent venue')
  const unload = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(unload); expect(unload.defaultPrevented).toBe(true)
  await userEvent.click(screen.getByRole('link', { name: 'Home link' }))
  const dialog = await screen.findByRole('dialog', { name: 'Leave this quotation?' })
  expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Keep editing' }))
  await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }))
  expect(screen.getByLabelText('Venue / location').value).toBe('Unsent venue')
  await act(async () => router.navigate(-1))
  await screen.findByRole('dialog', { name: 'Leave this quotation?' })
  await userEvent.click(screen.getByRole('button', { name: 'Leave quotation' }))
  expect(await screen.findByRole('heading', { name: 'Home page' })).not.toBeNull()
})

it.each([375, 768, 1024, 1440])('defaults the full price list appropriately at %ipx (media query, not layout)', async (value) => {
  width = value; start()
  const control = screen.getByRole('button', { name: value < 768 ? 'Show rates' : 'Hide rates' })
  expect(control.getAttribute('aria-expanded')).toBe(value >= 768 ? 'true' : 'false')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Download price list (PDF)' }).disabled).toBe(false))
})

it('preserves the PDF filename, nine groups, prices and contact/footer text for display-label catalog data', async () => {
  const labels = ['Chairs', 'Tables', 'Linens & Cloths', 'Tents & Canopies', 'Glassware & Tableware', 'Covers & Sashes', 'Décor', 'Sound & Lights', 'Other']
  const items = labels.map((category, id) => ({ id, category, name: `Equipment ${id}`, rental_price: id ? '100' : '0' }))
  const grouped = groupCatalog(items)
  await downloadPricelist(grouped)
  for (const [key, title] of PRICELIST_GROUPS) {
    expect(grouped[key]).toHaveLength(1)
    expect(pdf.text.mock.calls.some(([text]) => text === title.toUpperCase())).toBe(true)
  }
  for (const item of items) expect(pdf.text.mock.calls.some(([text]) => text === item.name)).toBe(true)
  expect(pdf.text.mock.calls.some(([text]) => text === 'P100')).toBe(true)
  expect(pdf.text.mock.calls.some(([text]) => text === '—')).toBe(true)
  expect(pdf.text.mock.calls.some(([text]) => text === 'PRICES ARE SUBJECT TO CHANGE WITHOUT PRIOR NOTICE.')).toBe(true)
  expect(pdf.save).toHaveBeenCalledExactlyOnceWith('Jan-Jimels-Pricelist.pdf')
})

it('keeps items_requested ordering, custom-prefix formatting, notes and null optional date compatible', () => {
  expect(buildPayload({ ...initialForm, items_requested: 'Notes', message: '' }, { 2: '4', 1: 2 }, [{ name: 'Stage', qty: 1 }], catalog)).toEqual({
    ...initialForm, event_date: null, items_requested: 'Round table x2\nWhite chair x4\nOther equipment: Stage x1\nNotes',
  })
})

it('routes backend field-error links to the correct step without dropping data', async () => {
  api.post.mockRejectedValueOnce({ response: { status: 400, data: { venue: ['Please clarify the venue.'], email: ['Please check this address.'] } } })
  start(); await equipment(); await review()
  await userEvent.type(screen.getByRole('textbox', { name: /Full name/ }), 'Test Customer')
  await userEvent.type(screen.getByLabelText('Email address'), 'customer@example.com')
  await send()
  await waitFor(() => expect(document.activeElement.id).toBe('quote-venue'))
  await userEvent.click(screen.getByRole('link', { name: 'Please check this address.' }))
  await waitFor(() => expect(document.activeElement.id).toBe('quote-email'))
  expect(screen.getByLabelText('Email address').value).toBe('customer@example.com')
  expect(screen.getByLabelText('Email address').getAttribute('aria-invalid')).toBe('true')
})
