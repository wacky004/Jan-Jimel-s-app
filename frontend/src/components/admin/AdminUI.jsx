import { useRef } from 'react'
import { Search } from 'lucide-react'
import { Button, EmptyState, ErrorState, LoadingSkeleton, TextField } from '../ui'
import useMediaQuery from '../../hooks/useMediaQuery'
import './admin.css'

export function AdminPageHeader({ title, description, action }) {
  return <header className="admin-page-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
}

export function AdminFilters({ children, active = [], onClear, search, onSearch, searchLabel = 'Search', searchHint }) {
  const searchRef = useRef(null)
  const clear = () => { onClear(); searchRef.current?.focus() }
  return <section className="admin-filters" aria-label="Filters">
    <div className="admin-filter-fields"><div className="admin-search"><Search size={18} aria-hidden="true" /><TextField ref={searchRef} type="search" label={searchLabel} hint={searchHint} value={search} onChange={(event) => onSearch(event.target.value)} /></div>{children}</div>
    <div className="admin-filter-summary"><p role="status">{active.length ? `Active filters: ${active.join('; ')}` : 'No active filters'}</p><Button variant="ghost" onClick={clear} disabled={!active.length}>Clear filters</Button></div>
  </section>
}

export function AdminListState({ loading, error, count, filtered, name, onRetry, onClear, children }) {
  const heading = useRef(null)
  const clear = () => { onClear(); heading.current?.focus() }
  return <section aria-label={`${name} results`} className="admin-results">
    <h2 ref={heading} tabIndex={-1} className="ui-sr-only">{name} results</h2>
    {loading ? <LoadingSkeleton label={`Loading ${name.toLowerCase()}`} lines={6} /> : error ? <ErrorState title={`${name} could not be loaded`} onRetry={() => { heading.current?.focus(); onRetry() }}>Please try again. Your filters have been kept.</ErrorState> : !count ? <EmptyState title={filtered ? `No matching ${name.toLowerCase()}` : `No ${name.toLowerCase()} yet`} action={filtered ? <Button variant="secondary" onClick={clear}>Clear filters</Button> : undefined}>{filtered ? 'Try a different search or clear your filters.' : 'New records will appear here. Use the action above to create a record.'}</EmptyState> : <><p className="admin-result-count" role="status">{count} {name.toLowerCase()} shown</p>{children}</>}
  </section>
}

// One representation is mounted so keyboard/screen-reader users get no duplicate actions.
export function AdminListing({ name, records, columns, actions }) {
  const desktop = useMediaQuery('(min-width: 1024px)')
  if (!desktop) return <ul className="admin-records" aria-label={name}>{records.map((record) => <li key={record.id} className="admin-record"><h3>{columns[0].render(record)}</h3><dl>{columns.slice(1).map((column) => <div key={column.key}><dt>{column.label}</dt><dd>{column.render(record)}</dd></div>)}</dl><div className="admin-row-actions">{actions(record)}</div></li>)}</ul>
  return <div className="admin-table-wrap"><table className="admin-table"><caption className="ui-sr-only">{name}</caption><thead><tr>{columns.map((column) => <th scope="col" key={column.key}>{column.label}</th>)}<th scope="col">Actions</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}>{columns.map((column, index) => index === 0 ? <th scope="row" key={column.key}>{column.render(record)}</th> : <td key={column.key}>{column.render(record)}</td>)}<td><div className="admin-row-actions">{actions(record)}</div></td></tr>)}</tbody></table></div>
}
