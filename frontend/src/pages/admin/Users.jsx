import { useState } from 'react'
import api from '../../api'
import { useAuth } from '../../auth'
import { Plus, Trash2, X } from 'lucide-react'
import { AdminFilters, AdminListing, AdminListState, AdminPageHeader } from '../../components/admin/AdminUI'
import useAdminData from '../../components/admin/useAdminData'
import { Button, btnGold, input, label, SelectField, StatusBadge } from '../../components/ui'

export default function Users() {
  const { user: me } = useAuth()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', first_name: '', last_name: '', role: 'admin' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const { data, loading, error: loadError, load } = useAdminData('/auth/users/')
  const users = (data || []).filter((u) => (!role || u.role === role) && `${u.full_name || ''} ${u.username}`.toLowerCase().includes(search.trim().toLowerCase()))
  const active = [search && `Search: ${search}`, role && `Role: ${role === 'super_admin' ? 'Super Admin' : 'Admin'}`].filter(Boolean)
  const clear = () => { setSearch(''); setRole('') }

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
      <AdminPageHeader title="Users" description="Create and manage admin accounts. Only super admins can do this." action={<Button variant="conversion" onClick={() => setShowForm(true)}><Plus size={18} aria-hidden="true" />Create Admin</Button>} />
      <AdminFilters search={search} onSearch={setSearch} searchLabel="Search users" searchHint="Search names and usernames in the loaded records." active={active} onClear={clear}>
        <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option></SelectField>
      </AdminFilters>
      <AdminListState name="Users" loading={loading} error={loadError} count={users.length} filtered={active.length > 0} onRetry={load} onClear={clear}>
        <AdminListing name="Users" records={users} columns={[
          { key: 'name', label: 'Name', render: (u) => <>{u.full_name || '—'}{u.id === me?.id && <span className="admin-secondary">You</span>}</> },
          { key: 'username', label: 'Username', render: (u) => u.username },
          { key: 'role', label: 'Role', render: (u) => <StatusBadge status={u.role === 'super_admin' ? 'completed' : 'confirmed'} label={u.role === 'super_admin' ? 'Super Admin' : 'Admin'} /> },
          { key: 'joined', label: 'Joined', render: (u) => new Date(u.date_joined).toLocaleDateString('en-PH') },
        ]} actions={(u) => <Button variant="danger" aria-label={`Delete admin ${u.username}`} disabled={u.id === me?.id} onClick={() => remove(u)}><Trash2 size={16} aria-hidden="true" />Delete</Button>} />
      </AdminListState>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:p-8">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-3xl border-b border-navy-100 bg-white px-6 py-4">
              <h3 className="font-display text-lg font-bold text-navy-900">Create Admin</h3>
              <button onClick={() => setShowForm(false)} className="text-navy-500 hover:text-navy-900" aria-label="Close">
                <X size={24} aria-hidden="true" />
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
