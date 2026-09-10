import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminLayout from '../src/pages/admin/AdminLayout'
import Dashboard from '../src/pages/admin/Dashboard'
import Orders from '../src/pages/admin/Orders'
import Inventory from '../src/pages/admin/Inventory'
import Quotations from '../src/pages/admin/Quotations'
import Users from '../src/pages/admin/Users'
import api from '../src/api'
import { downloadQuotationPdf } from '../src/pdf/quotePdf'

const auth = vi.hoisted(() => ({ user: { id: 1, username: 'owner', role: 'super_admin' }, logout: vi.fn() }))
vi.mock('../src/auth', () => ({ useAuth: () => auth }))
vi.mock('../src/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('../src/pdf/quotePdf', () => ({ downloadQuotationPdf: vi.fn(), downloadOrderPdf: vi.fn() }))
vi.mock('../src/pages/admin/OrderForm', () => ({ default: () => <p>Existing order form</p> }))
const order = { id: 21, customer_name: 'Sample Customer', contact_number: '09080000000', event_type: 'Birthday', event_date: '2026-12-01', delivery_address: 'Cainta hall', lat: '14.5', status: 'pending', status_display: 'Pending', items: [{ quantity: 3 }], total_price: '150.00' }
const item = { id: 31, name: 'White chair', color: 'White', size: 'Standard', category_display: 'Chairs', category: 'chairs', quantity_on_hand: 10, quantity_in_use: 3, quantity_available: 7, rental_price: '25.00', condition: 'good', condition_display: 'Good', is_low_stock: false }
const quote = { id: 41, name: 'Sample Customer', phone: '09080000000', email: '', event_type: 'Birthday', event_date: '2026-12-01', venue: 'Cainta hall', status: 'new', status_display: 'New', source: 'web', created_at: '2026-09-10T10:00:00Z', items: [{ description: 'Stage', quantity: 2, unit_price: '50', price_na: false }] }
const users = [{ id: 1, full_name: 'Sample Owner', username: 'owner', role: 'super_admin', date_joined: '2026-01-01' }, { id: 2, full_name: 'Sample Admin', username: 'staff', role: 'admin', date_joined: '2026-01-02' }]
const stats = { orders_pending: 2, orders_out_for_delivery: 1, deliveries_this_month: 3, revenue: '250', low_stock_count: 1, items_total: 5 }
let width, subscribers
beforeEach(() => {
  width = 375; subscribers = new Set()
  vi.stubGlobal('matchMedia', (query) => ({ get matches() { return width >= Number(query.match(/\d+/)[0]) }, addEventListener: (_type, listener) => subscribers.add(listener), removeEventListener: (_type, listener) => subscribers.delete(listener) }))
  vi.clearAllMocks()
  api.get.mockReset().mockImplementation(async (url) => ({ data: url === '/orders/dashboard/' ? stats : url.startsWith('/orders/?') ? { results: [order] } : url.startsWith('/orders/21/') ? order : url.startsWith('/items/') ? { results: [item] } : url.startsWith('/quotations/') ? { results: [quote] } : { results: users } }))
  auth.user = { id: 1, username: 'owner', role: 'super_admin' }
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function start(Page, path = '/admin') { return render(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>) }
const cases = [
  ['Orders', Orders, order.customer_name, /View order 21/],
  ['Inventory', Inventory, item.name, /Edit White chair/],
  ['Quotations', Quotations, quote.name, /Edit quotation 41/],
  ['Users', Users, users[0].full_name, /Delete admin staff/],
]

it.each(cases)('%s has loading, error/retry, empty and filtered-empty feedback', async (name, Page) => {
  let reject
  api.get.mockImplementation((url) => {
    if (name === 'Quotations' && url === '/items/') return Promise.resolve({ data: [] })
    return new Promise((_resolve, fail) => { reject = fail })
  })
  start(Page)
  expect(screen.getByText(`Loading ${name === 'Inventory' ? 'inventory items' : name.toLowerCase()}`)).not.toBeNull()
  await waitFor(() => expect(reject).toBeTypeOf('function'))
  await act(async () => reject(new Error('Offline')))
  expect(screen.getByRole('alert').textContent).toContain('could not be loaded')
  api.get.mockResolvedValue({ data: [] })
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText(`No ${name === 'Inventory' ? 'inventory items' : name.toLowerCase()} yet`)).not.toBeNull()
  await userEvent.type(screen.getByRole('searchbox'), 'missing')
  expect(await screen.findByText(`No matching ${name === 'Inventory' ? 'inventory items' : name.toLowerCase()}`)).not.toBeNull()
  expect(screen.getByText('Active filters: Search: missing')).not.toBeNull()
  await userEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])
  expect(screen.getByRole('searchbox').value).toBe('')
})

for (const size of [375, 768, 1024, 1440]) {
  it.each(cases)(`%s exposes primary information and actions at ${size}px (media query only)`, async (name, Page, title, action) => {
    width = size; start(Page)
    await screen.findByRole('button', { name: action })
    const listing = screen.getByRole(size >= 1024 ? 'table' : 'list', { name })
    expect(listing.textContent).toContain(title)
    expect(screen.queryByRole(size >= 1024 ? 'list' : 'table', { name })).toBeNull()
    if (name === 'Orders') { expect(listing.textContent).toContain('Cainta hall'); expect(listing.textContent).toContain('3 pcs'); expect(listing.textContent).toContain('₱150.00') }
    if (name === 'Inventory') for (const text of ['On Hand', 'In Use', 'Available', 'Good', '₱25.00']) expect(listing.textContent).toContain(text)
    if (name === 'Users') expect(screen.getByRole('button', { name: 'Delete admin owner' }).disabled).toBe(true)
  })
}

it('opens orders through explicit keyboard actions, not row clicks, with detail retry', async () => {
  width = 1024; start(Orders)
  const view = await screen.findByRole('button', { name: /View order 21/ })
  await userEvent.click(screen.getByRole('rowheader'))
  expect(api.get.mock.calls.some(([url]) => url === '/orders/21/')).toBe(false)
  api.get.mockRejectedValueOnce(new Error('Offline'))
  view.focus(); await userEvent.keyboard('{Enter}')
  expect(await screen.findByText('Order details could not be loaded.')).not.toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('heading', { name: 'Order #21 — Sample Customer' })).not.toBeNull()
  expect(api.get.mock.calls.filter(([url]) => url === '/orders/21/')).toHaveLength(2)
})

it('keeps Orders URL filters and requests compatible, including clear', async () => {
  start(Orders, '/admin/orders?status=out_for_delivery')
  expect(screen.getByLabelText('Order status').value).toBe('out_for_delivery')
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/orders/?status=out_for_delivery'))
  await userEvent.type(screen.getByRole('searchbox'), 'Cainta')
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/orders/?status=out_for_delivery&search=Cainta'))
  await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/orders/?'))
})

it('keeps inventory low-stock deep links and existing category/toggle parameter semantics', async () => {
  start(Inventory, '/admin/inventory?category=chairs&low_stock=true')
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/items/?category=chairs&low_stock=true'))
  expect(screen.getByLabelText('Low stock only').checked).toBe(true)
  await userEvent.selectOptions(screen.getByLabelText('Category'), 'tables')
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/items/?category=tables'))
  expect(screen.getByLabelText('Low stock only').checked).toBe(false)
  await userEvent.click(screen.getByLabelText('Low stock only'))
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/items/?category=tables&low_stock=true'))
  await userEvent.click(screen.getByLabelText('Low stock only'))
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/items/?'))
})

it('retains quotation server filters and exact PDF data while local search adds no API request', async () => {
  start(Quotations)
  await screen.findByRole('button', { name: /Download PDF for quotation 41/ })
  await userEvent.selectOptions(screen.getByLabelText('Quotation status'), 'replied')
  await userEvent.selectOptions(screen.getByLabelText('Source'), 'manual')
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/quotations/?status=replied&source=manual'))
  const count = api.get.mock.calls.length
  await userEvent.type(screen.getByRole('searchbox'), 'Sample')
  expect(api.get).toHaveBeenCalledTimes(count)
  await userEvent.click(screen.getByRole('button', { name: /Download PDF for quotation 41/ }))
  expect(downloadQuotationPdf).toHaveBeenCalledExactlyOnceWith({ id: 41, date: new Date(quote.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }), name: quote.name, phone: quote.phone, email: '', address: quote.venue, event_type: quote.event_type, event_date: quote.event_date, venue: quote.venue, items: quote.items })
})

it('keeps Users search/role filtering local and self-deletion disabled', async () => {
  start(Users)
  await screen.findByRole('button', { name: 'Delete admin staff' })
  await userEvent.selectOptions(screen.getByLabelText('Role'), 'admin')
  expect(screen.queryByRole('button', { name: 'Delete admin owner' })).toBeNull()
  await userEvent.type(screen.getByRole('searchbox'), 'nobody')
  expect(screen.getByText('No matching users')).not.toBeNull()
  expect(api.get).toHaveBeenCalledExactlyOnceWith('/auth/users/')
})

it('ignores a superseded Orders request so stale filter results cannot replace newer results', async () => {
  let resolveOld
  api.get.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }))
  start(Orders)
  await waitFor(() => expect(resolveOld).toBeTypeOf('function'))
  await userEvent.selectOptions(screen.getByLabelText('Order status'), 'pending')
  await screen.findByRole('button', { name: /View order 21/ })
  await act(async () => resolveOld({ data: [] }))
  expect(screen.getByRole('button', { name: /View order 21/ })).not.toBeNull()
})

it('dashboard recovers from loading/error, distinguishes zero data and preserves deep links', async () => {
  api.get.mockRejectedValueOnce(new Error('Offline'))
  start(Dashboard)
  expect(screen.getByText('Loading dashboard')).not.toBeNull()
  await screen.findByRole('alert')
  api.get.mockResolvedValueOnce({ data: Object.fromEntries(Object.keys(stats).map((key) => [key, 0])) })
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('No activity in this overview yet')).not.toBeNull()
  expect(screen.getByRole('link', { name: /Pending Orders/ }).getAttribute('href')).toBe('/admin/orders?status=pending')
  expect(screen.getByRole('link', { name: /Out for Delivery/ }).getAttribute('href')).toBe('/admin/orders?status=out_for_delivery')
  expect(screen.getByRole('link', { name: /Low Stock Items/ }).getAttribute('href')).toBe('/admin/inventory?low_stock=true')
})

it('Dashboard export reports failure and successful retry without changing URL, blob or filename', async () => {
  const create = vi.fn(() => 'blob:example'), revoke = vi.fn()
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  vi.stubGlobal('URL', class extends URL { static createObjectURL = create; static revokeObjectURL = revoke })
  start(Dashboard); await screen.findByRole('link', { name: /Pending Orders/ })
  api.get.mockRejectedValueOnce(new Error('Offline'))
  await userEvent.click(screen.getByRole('button', { name: 'Orders CSV' }))
  expect(await screen.findByText('Orders CSV could not be downloaded. Try the download again.')).not.toBeNull()
  const blob = new Blob(['synthetic,csv'])
  api.get.mockResolvedValueOnce({ data: blob })
  await userEvent.click(screen.getByRole('button', { name: 'Orders CSV' }))
  expect(await screen.findByText('Orders CSV is ready. Check your browser downloads.')).not.toBeNull()
  expect(api.get).toHaveBeenCalledWith('/api/orders/export/orders.csv', { responseType: 'blob' })
  expect(create).toHaveBeenCalledWith(blob); expect(revoke).toHaveBeenCalledWith('blob:example')
  expect(click.mock.instances[0].download).toBe('orders.csv'); click.mockRestore()
})

it('mobile navigation is grouped, traps/restores focus, closes on cancel and respects Users visibility', async () => {
  const { rerender } = start(AdminLayout)
  const trigger = screen.getByRole('button', { name: 'Open admin menu' })
  await userEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Admin menu' })
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect(document.body.style.overflow).toBe('hidden')
  for (const text of ['Overview', 'Operations', 'Sales', 'Catalog', 'Administration']) expect(within(dialog).getByRole('heading', { name: text })).not.toBeNull()
  const close = within(dialog).getByRole('button', { name: 'Close admin menu' })
  expect(document.activeElement).toBe(close)
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Log out' }))
  await userEvent.keyboard('{Tab}'); expect(document.activeElement).toBe(close)
  fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }))
  expect(document.activeElement).toBe(trigger); expect(document.body.style.overflow).not.toBe('hidden')
  auth.user = { id: 2, role: 'admin', username: 'staff' }
  rerender(<MemoryRouter><AdminLayout /></MemoryRouter>)
  await userEvent.click(trigger)
  expect(within(screen.getByRole('dialog')).queryByRole('link', { name: 'Users' })).toBeNull()
})

it('mobile navigation closes on a route or desktop change and does not reopen when returning to mobile', async () => {
  render(<MemoryRouter initialEntries={['/admin']}><Routes><Route path="/admin" element={<AdminLayout />}><Route index element={<p>Overview content</p>} /><Route path="orders" element={<p>Orders content</p>} /></Route></Routes></MemoryRouter>)
  await userEvent.click(screen.getByRole('button', { name: 'Open admin menu' }))
  await userEvent.click(screen.getByRole('link', { name: 'Orders & Delivery' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByText('Orders content')).not.toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Open admin menu' }))
  await act(async () => { width = 1024; [...subscribers].forEach((listener) => listener()) })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.body.style.overflow).not.toBe('hidden')
  expect(screen.getByRole('link', { name: 'Users' })).not.toBeNull()
  expect(document.activeElement.id).toBe('main-content')
  await act(async () => { width = 375; [...subscribers].forEach((listener) => listener()) })
  expect(screen.getByRole('button', { name: 'Open admin menu' }).getAttribute('aria-expanded')).toBe('false')
})
