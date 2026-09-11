import { useMemo, useState } from 'react'

import { formatPHPShort, newId } from '../lib/format'
import { BigButton, Field, inputClass, Modal, MoneyInput, Stepper } from './ui'

export default function PackageBuilder({ initial, catalog, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [price, setPrice] = useState(initial?.price ?? '')
  const [items, setItems] = useState(initial?.items || [])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const catalogItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter((it) => it.name.toLowerCase().includes(q))
  }, [catalog, search])

  const addItem = (catalogItem) => {
    setItems((arr) => {
      const existing = arr.find((it) => it.name === catalogItem.name)
      if (existing) {
        return arr.map((it) => (it.name === catalogItem.name ? { ...it, qty: it.qty + 1 } : it))
      }
      return [...arr, { id: newId(), name: catalogItem.name, qty: 1 }]
    })
  }

  const setQty = (id, qty) => {
    setItems((arr) => (qty <= 0 ? arr.filter((it) => it.id !== id) : arr.map((it) => (it.id === id ? { ...it, qty } : it))))
  }

  const save = () => {
    if (!name.trim()) return setError('Please enter a package name.')
    if (Number(price) <= 0) return setError('Please set the package price.')
    onSave({
      id: initial?.id || newId(),
      name: name.trim(),
      price: Number(price),
      items: items.map(({ name: n, qty }) => ({ name: n, qty })),
    })
  }

  return (
    <Modal
      title={initial ? 'Edit Package' : 'Build a Package'}
      onClose={onClose}
      footer={
        <BigButton onClick={save} variant="primary">
          💾 Save Package
        </BigButton>
      }
    >
      <div className="space-y-5">
        <Field label="Package name">
          <input
            className={inputClass}
            placeholder="e.g. Wedding Package A"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-bold tracking-wide text-navy-700 uppercase">
            Included items ({items.length})
          </p>
          {items.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-navy-200 bg-navy-50/50 px-4 py-5 text-center text-sm text-navy-500">
              Tap items below to include them in this package.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-navy-100 bg-white px-4 py-3">
                  <span className="flex-1 text-base font-semibold text-navy-900">{it.name}</span>
                  <Stepper value={it.qty} onChange={(q) => setQty(it.id, q)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-sm font-bold tracking-wide text-navy-700 uppercase">
            Package price (one price for everything)
          </p>
          <MoneyInput value={price} onChange={setPrice} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-bold tracking-wide text-navy-700 uppercase">Add items</p>
          <input
            className={inputClass}
            placeholder="🔍 Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
            {catalogItems.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => addItem(it)}
                className="flex w-full items-center justify-between rounded-2xl border-2 border-navy-100 bg-white px-4 py-3 text-left active:bg-navy-50"
              >
                <span>
                  <span className="block text-base font-semibold text-navy-900">{it.name}</span>
                  <span className="block text-xs text-navy-400">
                    {it.category}
                    {it.type === 'party' && Number(it.price) > 0 ? ` · ${formatPHPShort(it.price)} each` : ''}
                  </span>
                </span>
                <span className="text-2xl font-bold text-gold-600">＋</span>
              </button>
            ))}
            {catalogItems.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-navy-400">No items match your search.</p>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
