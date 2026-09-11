import localforage from 'localforage'

import { seedCatalog } from './catalogSeed'
import { newId } from './format'

localforage.config({
  name: 'jj-quotation',
  storeName: 'jj_store',
  description: 'Jan & Jimels offline quotation data',
})

const KEYS = {
  catalog: 'catalog',
  packages: 'packages',
  customers: 'customers',
  quotes: 'quotes',
  settings: 'settings',
}

async function get(key, fallback) {
  const value = await localforage.getItem(key)
  return value === null || value === undefined ? fallback : value
}

export const storage = {
  async init() {
    const catalog = await localforage.getItem(KEYS.catalog)
    if (!catalog) await localforage.setItem(KEYS.catalog, seedCatalog())
  },

  // Catalog -------------------------------------------------------------
  getCatalog: () => get(KEYS.catalog, []),
  async saveCatalog(catalog) {
    await localforage.setItem(KEYS.catalog, catalog)
    return catalog
  },
  async addCatalogItem(item) {
    const catalog = await storage.getCatalog()
    const next = [...catalog, { ...item, id: newId() }]
    await storage.saveCatalog(next)
    return next
  },
  async updateCatalogItem(id, patch) {
    const catalog = await storage.getCatalog()
    const next = catalog.map((it) => (it.id === id ? { ...it, ...patch } : it))
    await storage.saveCatalog(next)
    return next
  },
  async deleteCatalogItem(id) {
    const catalog = await storage.getCatalog()
    const next = catalog.filter((it) => it.id !== id)
    await storage.saveCatalog(next)
    return next
  },

  // Packages ------------------------------------------------------------
  getPackages: () => get(KEYS.packages, []),
  async savePackages(packages) {
    await localforage.setItem(KEYS.packages, packages)
    return packages
  },
  async upsertPackage(pkg) {
    const packages = await storage.getPackages()
    const exists = packages.some((p) => p.id === pkg.id)
    const next = exists
      ? packages.map((p) => (p.id === pkg.id ? pkg : p))
      : [...packages, { ...pkg, id: pkg.id || newId() }]
    await storage.savePackages(next)
    return next
  },
  async deletePackage(id) {
    const packages = await storage.getPackages()
    const next = packages.filter((p) => p.id !== id)
    await storage.savePackages(next)
    return next
  },

  // Customers -----------------------------------------------------------
  getCustomers: () => get(KEYS.customers, []),
  async rememberCustomer(name, phone) {
    const trimmed = String(name || '').trim()
    if (!trimmed) return
    const customers = await storage.getCustomers()
    const key = trimmed.toLowerCase()
    const existing = customers.find((c) => c.name.toLowerCase() === key)
    let next
    if (existing) {
      next = customers.map((c) =>
        c.name.toLowerCase() === key
          ? { ...c, phone: phone || c.phone, lastUsed: Date.now() }
          : c,
      )
    } else {
      next = [...customers, { id: newId(), name: trimmed, phone: phone || '', lastUsed: Date.now() }]
    }
    next.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
    await localforage.setItem(KEYS.customers, next.slice(0, 200))
  },

  // Quotes --------------------------------------------------------------
  getQuotes: () => get(KEYS.quotes, []),
  async saveQuote(quote) {
    const quotes = await storage.getQuotes()
    const record = { ...quote, id: quote.id || newId(), createdAt: quote.createdAt || Date.now() }
    const next = [record, ...quotes]
    await localforage.setItem(KEYS.quotes, next)
    return record
  },
  async deleteQuote(id) {
    const quotes = await storage.getQuotes()
    const next = quotes.filter((q) => q.id !== id)
    await localforage.setItem(KEYS.quotes, next)
    return next
  },

  // Settings / backup ---------------------------------------------------
  getSettings: () => get(KEYS.settings, { version: 1 }),
  saveSettings: (settings) => localforage.setItem(KEYS.settings, settings),

  async exportAll() {
    const [catalog, packages, customers, quotes, settings] = await Promise.all([
      storage.getCatalog(),
      storage.getPackages(),
      storage.getCustomers(),
      storage.getQuotes(),
      storage.getSettings(),
    ])
    return { version: 1, exportedAt: new Date().toISOString(), catalog, packages, customers, quotes, settings }
  },

  async importAll(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.catalog)) {
      throw new Error('Invalid backup file')
    }
    await localforage.setItem(KEYS.catalog, data.catalog)
    await localforage.setItem(KEYS.packages, data.packages || [])
    await localforage.setItem(KEYS.customers, data.customers || [])
    await localforage.setItem(KEYS.quotes, data.quotes || [])
    await localforage.setItem(KEYS.settings, data.settings || { version: 1 })
  },

  async resetAll() {
    await Promise.all([
      localforage.setItem(KEYS.catalog, seedCatalog()),
      localforage.setItem(KEYS.packages, []),
      localforage.setItem(KEYS.customers, []),
      localforage.setItem(KEYS.quotes, []),
      localforage.setItem(KEYS.settings, { version: 1 }),
    ])
  },
}
