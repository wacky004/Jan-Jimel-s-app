import { useRef } from 'react'
import { Check, Minus, Package, Plus, Search, Trash2 } from 'lucide-react'
import { Button, CheckboxField, EmptyState, ErrorState, IconButton, LoadingSkeleton, SelectField, TextField } from '../ui'
import { categoryKey, PRICELIST_GROUPS } from './quotationData'

export function Catalog({ catalog, search, setSearch, category, setCategory, selected, toggle, retry }) {
  const heading = useRef(null)
  const query = search.trim().toLowerCase()
  const filtered = catalog.items.filter((item) => (!category || categoryKey(item.category) === category) && (!query || item.name.toLowerCase().includes(query)))
  return <section className="quote-catalog" aria-labelledby="catalog-heading">
    <h3 id="catalog-heading" ref={heading} tabIndex={-1}>Browse equipment</h3>
    <div className="quote-fields">
      <div className="quote-search"><Search size={18} aria-hidden="true" /><TextField id="quote-search" type="search" label="Search equipment" value={search} onChange={(event) => setSearch(event.target.value)} hint="Search by equipment name." /></div>
      <SelectField id="quote-category" label="Category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{PRICELIST_GROUPS.map(([key, title]) => <option key={key} value={key}>{title}</option>)}</SelectField>
    </div>
    {catalog.status === 'loading' && <LoadingSkeleton label="Loading equipment catalog" lines={6} />}
    {catalog.status === 'error' && <ErrorState title="Equipment couldn’t be loaded" onRetry={() => { heading.current?.focus(); retry() }}>Try again, or describe what you need under Other equipment. Your selections and notes are retained.</ErrorState>}
    {catalog.status === 'loaded' && !catalog.items.length && <EmptyState title="No equipment listed yet">You can add Other equipment or describe your needs in the notes.</EmptyState>}
    {catalog.status === 'loaded' && catalog.items.length > 0 && !filtered.length && <EmptyState title="No matching equipment" action={<Button variant="secondary" onClick={() => { heading.current?.focus(); setSearch(''); setCategory('') }}>Clear search and category</Button>}>Try a different name or category.</EmptyState>}
    <p className="ui-sr-only" role="status">{catalog.status === 'loaded' ? `${filtered.length} equipment items shown.` : ''}</p>
    {catalog.status === 'loaded' && <div className="quote-catalog-grid">{filtered.map((item) => <article className="quote-item" data-selected={Object.hasOwn(selected, item.id)} key={item.id}>
      <div className="quote-item-photo">{item.photo_url ? <img src={item.photo_url} alt={item.name} width="64" height="64" loading="lazy" /> : <Package size={28} aria-hidden="true" />}{Object.hasOwn(selected, item.id) && <Check className="quote-selected-mark" size={20} aria-hidden="true" />}</div>
      <div><CheckboxField label={item.name} checked={Object.hasOwn(selected, item.id)} onChange={() => toggle(item.id)} />
      <p>{[item.color, item.size].filter(Boolean).join(' · ')}</p><p>₱{Number(item.rental_price).toLocaleString()} / day</p></div>
    </article>)}</div>}
  </section>
}

export function SelectedEquipment({ selected, items, changeQuantity, remove, errors }) {
  const heading = useRef(null)
  return <section className="quote-selection" aria-labelledby="selected-heading"><h3 ref={heading} tabIndex={-1} id="selected-heading">Selected equipment</h3>
    <p role="status" className="quote-help">{Object.keys(selected).length} equipment types selected.</p>
    {!Object.keys(selected).length ? <p className="quote-help">Choose equipment above, or add a custom request below.</p> : <ul>{Object.entries(selected).map(([id, qty]) => {
      const name = items.find((item) => item.id === Number(id))?.name || 'Item'
      return <li key={id}><strong>{name}</strong><div className="quote-quantity">
        <IconButton label={`Decrease quantity for ${name}`} onClick={() => { if (Number(qty) <= 1) { heading.current?.focus(); remove(id) } else changeQuantity(id, Number(qty) - 1) }}><Minus size={18} aria-hidden="true" /></IconButton>
        <TextField id={`quote-quantity-${id}`} label={`Quantity for ${name}`} type="number" min="1" step="1" inputMode="numeric" value={qty} onChange={(event) => changeQuantity(id, event.target.value)} error={errors[`quantity-${id}`]} />
        <IconButton label={`Increase quantity for ${name}`} onClick={() => changeQuantity(id, (Number(qty) || 0) + 1)}><Plus size={18} aria-hidden="true" /></IconButton>
        <IconButton label={`Remove ${name}`} onClick={() => { heading.current?.focus(); remove(id) }}><Trash2 size={18} aria-hidden="true" /></IconButton>
      </div></li>
    })}</ul>}
  </section>
}

export function OtherEquipment({ others, name, quantity, setName, setQuantity, add, remove, errors }) {
  const input = useRef(null)
  const handleEnter = (event) => { if (event.key === 'Enter') { event.preventDefault(); add() } }
  return <section className="quote-custom" aria-labelledby="other-heading"><h3 id="other-heading">Other equipment</h3><p className="quote-help">Can’t find an item? Add its name and quantity. Our team will confirm whether it is available.</p>
    <div className="quote-custom-fields"><TextField id="quote-other_name" ref={input} label="Other equipment name" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={handleEnter} hint="Select Add equipment to include this entry in your request." error={errors.other_name} />
    <TextField id="quote-other_qty" label="Other equipment quantity" type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} onKeyDown={handleEnter} error={errors.other_qty} />
    <Button onClick={add}><Plus size={18} aria-hidden="true" />Add equipment</Button></div>
    <ul>{others.map((item, index) => <li key={index}><span>{item.name} × {item.qty}</span><IconButton label={`Remove other equipment ${item.name}, entry ${index + 1}`} onClick={() => { input.current?.focus(); remove(index) }}><Trash2 size={18} aria-hidden="true" /></IconButton></li>)}</ul>
  </section>
}
