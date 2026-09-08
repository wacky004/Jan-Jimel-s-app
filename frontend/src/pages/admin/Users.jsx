import { useEffect, useState } from 'react'
import api from '../../api'
import { useAuth } from '../../auth'
import { btnGold, input, label, StatusBadge } from '../../components/ui'

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', first_name: '', last_name: '', role: 'admin' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    api.get('/auth/users/').then(({ data }) => setUsers(data.results || data)).catch(() => {})
  }

  useEffect(load, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/auth/users/register/', form)
      setShowForm(false)
      setForm({ username: '', password: '', first_name: '', last_name: '', role: 'admin' })
      load()
    } catch (err) {
      setError(err.response?.data?.username?.[0] || err.response?.data?.password?.[0] || 'Could not create the user.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (u) => {
    if (!window.confirm(`Delete admin "${u.username}"? This cannot be undone.`)) return
    try {
      await api.delete(`/auth/users/${u.id}/delete/`)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete the user.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-900">Users</h2>
          <p className="text-sm text-navy-600">
            Create and manage admin accounts. Only super admins can do this.
          </p>
        </div>
        <button className={btnGold} onClick={() => setShowForm(true)}>
          + Create Admin
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60 text-[11px] tracking-wider text-navy-600 uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-navy-50 last:border-0">
                <td className="px-4 py-3.5 font-semibold text-navy-900">
                  {u.full_name || '—'}
                  {u.id === me?.id && <span className="ml-2 text-xs font-normal text-gold-600">(you)</span>}
                </td>
                <td className="px-4 py-3.5 text-navy-700">{u.username}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge
                    status={u.role === 'super_admin' ? 'completed' : 'confirmed'}
                    label={u.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  />
                </td>
                <td className="px-4 py-3.5 text-navy-600">
                  {new Date(u.date_joined).toLocaleDateString('en-PH')}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                    disabled={u.id === me?.id}
                    onClick={() => remove(u)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:p-8">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-3xl border-b border-navy-100 bg-white px-6 py-4">
              <h3 className="font-display text-lg font-bold text-navy-900">Create Admin</h3>
              <button onClick={() => setShowForm(false)} className="text-navy-500 hover:text-navy-900" aria-label="Close">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>First Name</label>
                  <input className={input} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div>
                  <label className={label}>Last Name</label>
                  <input className={input} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={label}>Username *</label>
                <input required className={input} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className={label}>Password * (min. 6 characters)</label>
                <input required type="password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className={label}>Role</label>
                <select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}
              <button type="submit" disabled={saving} className={`${btnGold} w-full`}>
                {saving ? 'Creating…' : 'Create Admin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
