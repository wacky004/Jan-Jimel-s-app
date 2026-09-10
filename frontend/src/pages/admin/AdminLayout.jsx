import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Truck, MapPin, FileText, Package, Users, Menu, LogOut } from 'lucide-react'
import { useAuth } from '../../auth'
import { Button, Drawer, IconButton } from '../../components/ui'
import useMediaQuery from '../../hooks/useMediaQuery'
import '../../components/admin/admin.css'

const groups = [
  { label: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Operations', items: [{ to: '/admin/orders', label: 'Orders & Delivery', icon: Truck }, { to: '/admin/map', label: 'Delivery Map', icon: MapPin }] },
  { label: 'Sales', items: [{ to: '/admin/quotations', label: 'Quotations', icon: FileText }] },
  { label: 'Catalog', items: [{ to: '/admin/inventory', label: 'Inventory', icon: Package }] },
  { label: 'Administration', superOnly: true, items: [{ to: '/admin/users', label: 'Users', icon: Users }] },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const desktop = useMediaQuery('(min-width: 1024px)')
  useEffect(() => {
    if (desktop && document.activeElement === document.body) document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [desktop])
  const doLogout = () => { logout(); navigate('/admin/login') }
  const navigation = (onNavigate) => <div className="admin-navigation">
    <div className="admin-brand"><img src="/images/logo.jpg" alt="Jan & Jimels logo" /><p>Jan &amp; Jimels<small>Admin portal</small></p></div>
    <nav aria-label="Admin navigation">{groups.filter((group) => !group.superOnly || user?.role === 'super_admin').map((group) => <section className="admin-nav-group" key={group.label} aria-label={group.label}><h2>{group.label}</h2>{group.items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/admin'} onClick={onNavigate}><Icon size={20} aria-hidden="true" />{label}</NavLink>)}</section>)}</nav>
    <div className="admin-account"><p>{user?.full_name || user?.username}</p><p>{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p><Button variant="ghost" onClick={doLogout}><LogOut size={18} aria-hidden="true" />Log out</Button></div>
  </div>
  return <div className="admin-shell">
    {desktop && <aside className="admin-sidebar">{navigation()}</aside>}
    <div className="admin-workspace"><header className="admin-topbar">{!desktop && <MobileNavigation key={location.pathname} navigation={navigation} />}<p>Jan &amp; Jimels Party Needs</p></header><main id="main-content" tabIndex={-1} className="admin-main"><Outlet /></main></div>
  </div>
}

// Unmounting on a desktop breakpoint or route change resets the mobile menu.
function MobileNavigation({ navigation }) {
  const [open, setOpen] = useState(false)
  return <><IconButton label="Open admin menu" aria-expanded={open} aria-controls="admin-menu" onClick={() => setOpen(true)}><Menu size={22} aria-hidden="true" /></IconButton><Drawer id="admin-menu" side="left" className="admin-drawer" open={open} onClose={() => setOpen(false)} title="Admin menu" description="Navigate your business workspace." closeLabel="Close admin menu">{navigation(() => setOpen(false))}</Drawer></>
}
