import { act, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ user: null, loading: false }))
vi.mock('../src/auth', () => ({ AuthProvider: ({ children }) => children, useAuth: () => auth }))
vi.mock('../src/components/Navbar', () => ({ default: () => null }))
vi.mock('../src/components/Footer', () => ({ default: () => null }))
vi.mock('../src/pages/Landing', () => ({ default: () => <h1>Home</h1> }))
vi.mock('../src/pages/Quotation', () => ({ default: () => <h1>Public quotation</h1> }))
vi.mock('../src/pages/Login', () => ({ default: () => <h1>Login</h1> }))
vi.mock('../src/pages/admin/AdminLayout', async () => { const { Outlet } = await import('react-router-dom'); return { default: () => <main id="main-content" tabIndex={-1}><Outlet /></main> } })
vi.mock('../src/pages/admin/Dashboard', () => ({ default: () => <h1>Dashboard</h1> }))
vi.mock('../src/pages/admin/Orders', () => ({ default: () => <h1>Orders</h1> }))
vi.mock('../src/pages/admin/Inventory', () => ({ default: () => <h1>Inventory</h1> }))
vi.mock('../src/pages/admin/DeliveryMap', () => ({ default: () => <h1>Map</h1> }))
vi.mock('../src/pages/admin/Quotations', () => ({ default: () => <h1>Admin quotations</h1> }))
vi.mock('../src/pages/admin/Users', () => ({ default: () => <h1>Users</h1> }))
import App from '../src/App'

async function visit(path) {
  await act(async () => {
    window.history.pushState({ ...window.history.state, idx: (window.history.state?.idx || 0) + 1 }, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}
it('preserves public paths, anonymous redirects, requested destinations and admin/super-admin guards', async () => {
  render(<App />)
  await visit('/quote'); expect(await screen.findByRole('heading', { name: 'Public quotation' })).not.toBeNull()
  for (const path of ['/admin', '/admin/orders', '/admin/inventory', '/admin/map', '/admin/quotations', '/admin/users']) {
    await visit(path)
    await waitFor(() => expect(window.location.pathname).toBe('/admin/login'))
    expect(screen.getByRole('heading', { name: 'Login' })).not.toBeNull()
    expect(window.history.state.usr.from).toBe(path)
  }
  auth.user = { role: 'admin' }
  for (const [path, title] of [['/admin', 'Dashboard'], ['/admin/orders', 'Orders'], ['/admin/inventory', 'Inventory'], ['/admin/map', 'Map'], ['/admin/quotations', 'Admin quotations']]) {
    await visit(path); expect(await screen.findByRole('heading', { name: title })).not.toBeNull()
  }
  await visit('/admin/users')
  await waitFor(() => expect(window.location.pathname).toBe('/admin'))
  expect(screen.queryByRole('heading', { name: 'Users' })).toBeNull()
  auth.user = { role: 'super_admin' }
  await visit('/admin/users'); expect(await screen.findByRole('heading', { name: 'Users' })).not.toBeNull()
  await visit('/unknown'); await waitFor(() => expect(window.location.pathname).toBe('/'))
  expect(screen.getByRole('heading', { name: 'Home' })).not.toBeNull()
})
