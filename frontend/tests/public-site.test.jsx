import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Navbar from '../src/components/Navbar'
import Gallery from '../src/components/public/Gallery'
import Rentals from '../src/components/public/Rentals'
import Hero3D from '../src/components/Hero3D'
import { galleryPhotos } from '../src/components/public/galleryData'
import api from '../src/api'

vi.mock('../src/api', () => ({ default: { get: vi.fn() } }))
vi.mock('../src/components/public/HeroScene', () => ({ default: () => <div data-testid="desktop-scene" /> }))
let viewport, observers, media
function resize(values) {
  act(() => {
    Object.assign(viewport, values)
    for (const query of media.values()) query.listeners.forEach((listener) => listener({ matches: query.matches }))
  })
}
beforeEach(() => {
  viewport = { width: 375, reduced: false, fine: true }; observers = []; media = new Map()
  vi.stubGlobal('matchMedia', (query) => {
    if (!media.has(query)) media.set(query, {
      get matches() {
        if (query.includes('prefers-reduced-motion')) return viewport.reduced
        return viewport.width >= Number(query.match(/min-width: (\d+)px/)?.[1] || 0) && (!query.includes('pointer: fine') || viewport.fine)
      },
      listeners: new Set(),
      addEventListener(_event, listener) { this.listeners.add(listener) },
      removeEventListener(_event, listener) { this.listeners.delete(listener) },
    })
    return media.get(query)
  })
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe() { this.callback([{ isIntersecting: true }]) }
    disconnect() {}
  })
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(callback, 0))
  vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id))
  vi.mocked(api.get).mockReset()
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
function NavExample({ initial = '/' }) {
  return <MemoryRouter initialEntries={[initial]}><Navbar /><main id="main-content" tabIndex={-1}><Routes><Route path="/" element={<section id="equipment" tabIndex={-1}><h1>Rental section</h1></section>} /><Route path="/quote" element={<h1>Quote form</h1>} /></Routes></main></MemoryRouter>
}

describe('public navigation', () => {
  it('exposes state, focuses and traps menu controls, restores the opener on cancel', async () => {
    const user = userEvent.setup(); render(<NavExample />)
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')))
    const opener = screen.getByRole('button', { name: 'Open navigation' })
    expect(opener.getAttribute('aria-expanded')).toBe('false')
    expect(document.getElementById(opener.getAttribute('aria-controls'))).not.toBeNull()
    await user.click(opener)
    const menu = screen.getByRole('dialog')
    expect(opener.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(within(menu).getByRole('link', { name: 'Home' }))
    within(menu).getByRole('link', { name: 'Call 0908-950-3879' }).focus()
    await user.tab()
    expect(document.activeElement).toBe(within(menu).getByRole('button', { name: 'Close navigation' }))
    fireEvent(menu, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
    expect(document.body.style.overflow).toBe('')
  })
  it('closes on cross-page hash navigation and focuses its section', async () => {
    render(<NavExample initial="/quote" />)
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('link', { name: 'Rentals & Rates' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement.id).toBe('equipment'))
    expect(document.body.style.overflow).toBe('')
  })
  it('closes and releases scroll on desktop resize without reopening on mobile', async () => {
    render(<NavExample />)
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(document.body.style.overflow).toBe('hidden')
    resize({ width: 1440 })
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Jan & Jimels Party Needs — Home' })))
    expect(screen.queryByRole('dialog')).toBeNull(); expect(document.body.style.overflow).toBe('')
    resize({ width: 375 }); expect(screen.queryByRole('dialog')).toBeNull()
  })
})

it('retains 20 gallery photos and supports previous/next, arrows, Tab and close restoration', async () => {
  const user = userEvent.setup(); render(<Gallery />)
  expect(screen.getAllByRole('img')).toHaveLength(20)
  const trigger = screen.getByRole('button', { name: `View photo 1: ${galleryPhotos[0].alt}` })
  trigger.focus(); await user.keyboard('{Enter}')
  const dialog = screen.getByRole('dialog', { name: 'Event gallery' })
  expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Close gallery' }))
  await user.keyboard('{ArrowLeft}')
  expect(within(dialog).getByRole('img').getAttribute('src')).toBe(galleryPhotos[19].src)
  await user.click(within(dialog).getByRole('button', { name: 'Next' }))
  expect(within(dialog).getByRole('img').getAttribute('alt')).toBe(galleryPhotos[0].alt)
  await user.keyboard('{ArrowRight}')
  expect(within(dialog).getByRole('img').getAttribute('alt')).toBe(galleryPhotos[1].alt)
  await user.tab()
  expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Close gallery' }))
  await user.keyboard('{Enter}'); expect(document.activeElement).toBe(trigger)
})

describe('public rental rates', () => {
  it('shows loading/failure, retries the same endpoint and renders only public rate fields', async () => {
    let fail
    vi.mocked(api.get).mockReturnValueOnce(new Promise((_resolve, reject) => { fail = reject }))
    render(<MemoryRouter><Rentals /></MemoryRouter>)
    expect(screen.getByText('Loading rental rates')).not.toBeNull()
    await act(async () => fail(new Error('Network unavailable')))
    expect(screen.getByRole('alert').textContent).toContain('Rental rates couldn’t be loaded')
    vi.mocked(api.get).mockResolvedValueOnce({ data: { results: [{ id: 1, name: 'Sample chair', category: 'chairs', rental_price: '125.00', quantity_on_hand: 999, notes: 'Private stock note' }, { id: 2, name: 'Unpriced item', category: 'chairs', rental_price: '0' }] } })
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Sample chair')).not.toBeNull(); expect(screen.getByText('₱125')).not.toBeNull()
    for (const text of ['Unpriced item', 'Private stock note', '999']) expect(screen.queryByText(text)).toBeNull()
    expect(document.activeElement.textContent).toBe('Current rental rates')
    expect(vi.mocked(api.get).mock.calls).toEqual([['/items/'], ['/items/']])
    expect(screen.getByRole('link', { name: 'Request a Quote' }).getAttribute('href')).toBe('/quote')
  })
  it('distinguishes an empty unpaginated catalog from failure', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] }); render(<MemoryRouter><Rentals /></MemoryRouter>)
    expect(await screen.findByText('No rental rates to display')).not.toBeNull()
    expect(screen.queryByRole('alert')).toBeNull(); expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })
})

describe('adaptive hero', () => {
  it.each([375, 768, 1024, 1440])('selects its mode at %ipx (media-query test, not layout QA)', async (width) => {
    viewport.width = width; render(<Hero3D />)
    if (width >= 1024) expect(await screen.findByTestId('desktop-scene')).not.toBeNull()
    else { expect(screen.getByRole('img').getAttribute('src')).toBe(galleryPhotos[19].src); expect(screen.queryByTestId('desktop-scene')).toBeNull() }
  })
  it('unmounts expensive scene as viewport, motion, pointer, visibility and pause change', async () => {
    viewport.width = 1440; render(<Hero3D />)
    expect(await screen.findByTestId('desktop-scene')).not.toBeNull()
    resize({ reduced: true }); expect(screen.queryByTestId('desktop-scene')).toBeNull(); expect(screen.queryByRole('button')).toBeNull()
    resize({ reduced: false }); await screen.findByTestId('desktop-scene')
    resize({ width: 375 }); expect(screen.queryByTestId('desktop-scene')).toBeNull()
    resize({ width: 1440, fine: false }); expect(screen.queryByTestId('desktop-scene')).toBeNull()
    resize({ fine: true }); await screen.findByTestId('desktop-scene')
    await userEvent.click(screen.getByRole('button', { name: 'Pause animation' })); expect(screen.queryByTestId('desktop-scene')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Play animation' })); await screen.findByTestId('desktop-scene')
    act(() => observers[0].callback([{ isIntersecting: false }])); expect(screen.queryByTestId('desktop-scene')).toBeNull()
    act(() => observers[0].callback([{ isIntersecting: true }])); await screen.findByTestId('desktop-scene')
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    fireEvent(document, new Event('visibilitychange')); expect(screen.queryByTestId('desktop-scene')).toBeNull()
    hidden.mockReturnValue(false); fireEvent(document, new Event('visibilitychange')); await screen.findByTestId('desktop-scene')
  })
})
