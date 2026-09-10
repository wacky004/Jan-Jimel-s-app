import { lazy, Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
import { createBrowserRouter, RouterProvider, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import RouteFocus from './components/RouteFocus'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Quotation from './pages/Quotation'

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const DeliveryMap = lazy(() => import('./pages/admin/DeliveryMap'))
const Inventory = lazy(() => import('./pages/admin/Inventory'))
const Orders = lazy(() => import('./pages/admin/Orders'))
const Quotations = lazy(() => import('./pages/admin/Quotations'))
const Users = lazy(() => import('./pages/admin/Users'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-sm font-medium text-navy-600">Loading…</p>
    </div>
  )
}

function Protected({ children, superOnly = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-50">
        <p className="text-sm font-medium text-navy-600">Loading…</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  if (superOnly && user.role !== 'super_admin') return <Navigate to="/admin" replace />
  return children
}

function PublicLayout({ children }) {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  if (location.pathname === '/admin/login') return <main id="main-content" tabIndex={-1}>{children}</main>
  if (isAdmin) return children
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <Footer />
    </>
  )
}

function AppRoutes() {
  return (
        <MotionConfig reducedMotion="user">
          <a href="#main-content" className="ui-skip-link" onClick={(event) => {
            const main = document.getElementById('main-content')
            if (main) { event.preventDefault(); main.focus(); main.scrollIntoView({ block: 'start' }) }
          }}>Skip to main content</a>
          <RouteFocus />
          <PublicLayout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/quote" element={<Quotation />} />
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <Protected>
                    <Suspense fallback={<PageLoader />}>
                      <AdminLayout />
                    </Suspense>
                  </Protected>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="map" element={<DeliveryMap />} />
                <Route path="quotations" element={<Quotations />} />
                <Route
                  path="users"
                  element={
                    <Protected superOnly>
                      <Users />
                    </Protected>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PublicLayout>
        </MotionConfig>
  )
}

// Data-router context enables supported navigation blocking for unsent quotes.
// The existing descendant routes and Protected guards remain unchanged.
const router = createBrowserRouter([{ path: '*', element: <AppRoutes /> }])

export default function App() {
  return <AuthProvider><RouterProvider router={router} /></AuthProvider>
}
