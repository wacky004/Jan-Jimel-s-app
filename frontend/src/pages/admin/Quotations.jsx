import { jsPDF } from 'jspdf'
import { useCallback, useEffect, useState } from 'react'
import api from '../../api'
import { btnGold, formatDateTime, input, StatusBadge } from '../../components/ui'

const filters = [
  ['', 'All Requests'],
  ['new', 'New'],
  ['replied', 'Replied'],
  ['closed', 'Closed'],
]

export default function Quotations() {
  const [list, setList] = useState([])
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      const { data } = await api.get(`/quotations/?${params}`)
      setList(data.results || data)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const open = (q) => {
    setSelected(q)
    setReply(q.reply || '')
  }

  const save = async (newStatus) => {
    if (!selected) return
    setSaving(true)
    try {
      await api.put(`/quotations/${selected.id}/`, { ...selected, reply, status: newStatus || selected.status })
      setSelected(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const print = (q) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Jan & Jimels Party Needs', 105, 18, { align: 'center' })
    doc.setFontSize(11)
    doc.text('Event Rentals & Supplies - Est. 1995', 105, 25, { align: 'center' })
    doc.text('#1 Pelota St., Saint Francis Village, Cainta, Rizal', 105, 31, { align: 'center' })
    doc.text('0908-950-3879 | 0999-760-3211 | janjimels95@gmail.com', 105, 37, { align: 'center' })

    doc.setFontSize(14)
    doc.text(`QUOTATION REQUEST #${q.id}`, 14, 50)
    doc.setFontSize(10)
    doc.text(`Name: ${q.name}`, 14, 58)
    doc.text(`Contact: ${[q.phone, q.email].filter(Boolean).join(' | ') || '—'}`, 14, 64)
    doc.text(`Event: ${q.event_type || '—'} on ${q.event_date || '—'} at ${q.venue || '—'}`, 14, 70)
    let y = 80
    if (q.items_requested) {
      doc.text('Requested Items:', 14, y)
      y += 6
      q.items_requested.split('\n').forEach((line) => {
        doc.text(`- ${line}`, 18, y)
        y += 6
      })
    }
    if (q.reply) {
      y += 4
      doc.text('Our Quotation:', 14, y)
      y += 6
      q.reply.split('\n').forEach((line) => {
        doc.text(line, 18, y)
        y += 6
      })
    }
    doc.save(`Quotation-${q.id}-${q.name.replace(/\s+/g, '-')}.pdf`)
  }

  const remove = async (q) => {
    if (!window.confirm(`Delete request from ${q.name}?`)) return
    await api.delete(`/quotations/${q.id}/`)
    load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy-900">Quotations &amp; Inquiries</h2>
        <p className="text-sm text-navy-600">
          Requests sent by customers through the website quotation form.
        </p>
      </div>

      <select
        className={`${input} w-auto`}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        {filters.map(([v, l]) => (
          <option key={v || 'all'} value={v}>{l}</option>
        ))}
      </select>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <p className="text-sm text-navy-500">Loading requests…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-navy-500">No quotation requests yet.</p>
        ) : (
          list.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900">{q.name}</p>
                  <p className="text-xs text-navy-500">
                    {[q.phone, q.email].filter(Boolean).join(' · ') || 'no contact given'}
                  </p>
                </div>
                <StatusBadge status={q.status} label={q.status_display} />
              </div>
              <div className="mt-3 space-y-1 text-sm text-navy-700">
                <p>
                  <span className="font-medium text-navy-900">Event:</span>{' '}
                  {q.event_type || '—'} · {q.event_date || 'no date'}
                </p>
                <p className="line-clamp-2">
                  <span className="font-medium text-navy-900">Venue:</span> {q.venue || '—'}
                </p>
                {q.items_requested && (
                  <p className="line-clamp-3 text-navy-600 whitespace-pre-line">{q.items_requested}</p>
                )}
              </div>
              <p className="mt-3 text-xs text-navy-400">{formatDateTime(q.created_at)}</p>
              <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 rounded-full bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy-700"
                  onClick={() => open(q)}
                >
                  Reply
                </button>
                <button
                  className="rounded-full border border-navy-200 px-4 py-2 text-xs font-semibold text-navy-700 transition hover:border-navy-400"
                  onClick={() => print(q)}
                >
                  Print
                </button>
                <button
                  className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                  onClick={() => remove(q)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selected && (
        <Modal title={`Reply to ${selected.name}`} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4 text-sm">
              <p className="font-medium text-navy-900">
                {selected.event_type || 'Event'} on {selected.event_date || '—'} · {selected.venue || '—'}
              </p>
              {selected.items_requested && (
                <p className="mt-2 text-navy-700 whitespace-pre-line">{selected.items_requested}</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-navy-700 uppercase">
                Your reply / quotation (sent via phone, email or SMS)
              </p>
              <textarea
                rows={6}
                className={input}
                placeholder="Dear …, thank you for your inquiry! Here is your quotation: …"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                className="rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400"
                disabled={saving}
                onClick={() => save('replied')}
              >
                Save as Replied
              </button>
              <button
                className={btnGold}
                disabled={saving}
                onClick={() => save('closed')}
              >
                {saving ? 'Saving…' : 'Save & Close'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, title, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-3xl border-b border-navy-100 bg-white px-6 py-4">
          <h3 className="font-display text-lg font-bold text-navy-900">{title}</h3>
          <button onClick={onClose} className="text-navy-500 transition hover:text-navy-900" aria-label="Close">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
