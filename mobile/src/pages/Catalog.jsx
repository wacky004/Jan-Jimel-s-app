import { useEffect, useMemo, useState } from 'react'

import { BigButton, Field, inputClass, Modal, MoneyInput, TopBar } from '../components/ui'
import { formatPHPShort } from '../lib/format'
import { storage } from '../lib/storage'

const CATEGORIES = ['Chairs', 'Tables', 'Linen & Decor', 'Tent', 'Equipment', 'Others']

const emptyForm = { name: '', category: 'Chairs', price: '' }

export default function Catalog() {
  const [catalog, setCatalog] = useState([])
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = () => storage.getCatalog().then(setCatalog)
  useEffect(() => {
    load()
  }, [])

  const party = useMemo(() => catalog.filter((it) => it.type === 'party'), [catalog])
  const equipment = useMemo(() => catalog.filter((it) => it.type === 'equipment'), [catalog])

  const openNew = (type) => {
    setEditing('new')
    setForm({ ...emptyForm, category: type === 'equipment' ? 'Equipment' : 'Chairs' })
    setError('')
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({ name: item.name, category: item.category, price: item.type === 'party' ? item.price : '' })
    setError('')
  }

  const save = async () => {
    if (!form.name.trim()) return setError('Please enter the item name.')
    const type = editing === 'new' ? (form.category === 'Equipment' ? 'equipment' : 'party') : editing.type
    const payload = {
      type,
      name: form.name.trim(),
      category: form.category,
      price: type === 'party' ? Number(form.price || 0) : 0,
    }
    if (editing === 'new') {
      setCatalog(await storage.addCatalogItem(payload))
    } else {
      setCatalog(await storage.updateCatalogItem(editing.id, payload))
    }
    setEditing(null)
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    setCatalog(await storage.deleteCatalogItem(item.id))
  }

  const renderList = (list, type) => (
    <div className="space-y-2">
      {list.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => openEdit(it)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-navy-100 bg-white px-4 py-3 text-left active:bg-navy-50"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-base leading-snug font-semibold break-words text-navy-900">{it.name}</span>
            <span className="block text-xs text-navy-400">{it.category}</span>
          </span>
          <span className="text-base font-bold text-navy-900">
            {type === 'party' ? formatPHPShort(it.price) : 'in packages'}
          </span>
        </button>
      ))}
      <BigButton variant="outline" onClick={() => openNew(type)}>
        ➕ Add item
      </BigButton>
    </div>
  )

  return (
    <div className="safe-top min-h-screen bg-navy-50">
      <TopBar title="Items & Prices" onBack={() => window.history.back()} />
      <div className="safe-bottom mx-auto max-w-lg space-y-6 px-4 py-5">
        <div>
          <h2 className="text-lg font-bold text-navy-900">🪑 Party Needs (per item)</h2>
          <p className="mb-3 text-sm text-navy-500">Priced individually — customers are charged per piece.</p>
          {renderList(party, 'party')}
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy-900">📦 Equipment (for packages)</h2>
          <p className="mb-3 text-sm text-navy-500">Included in packages with one package price.</p>
          {renderList(equipment, 'equipment')}
        </div>
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add Item' : 'Edit Item'}
          onClose={() => setEditing(null)}
          footer={
            <div className="space-y-2">
              <BigButton onClick={save}>💾 Save</BigButton>
              {editing !== 'new' && (
                <BigButton
                  variant="danger"
                  onClick={() => {
                    remove(editing)
                    setEditing(null)
                  }}
                >
                  🗑 Delete item
                </BigButton>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <Field label="Item name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            {form.category !== 'Equipment' && (
              <div>
                <p className="mb-1.5 text-sm font-bold tracking-wide text-navy-700 uppercase">Price per item</p>
                <MoneyInput value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
              </div>
            )}
            {error && (
              <p className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
