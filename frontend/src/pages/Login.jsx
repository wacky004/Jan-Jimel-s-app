import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      const from = location.state?.from || '/admin'
      navigate(from, { replace: true })
    } catch (err) {
      if (err?.response?.status === 429) {
        setError('Too many attempts — please try again shortly.')
      } else {
        setError('Invalid username or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-6">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-navy-400/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-navy-950/50 backdrop-blur-xl sm:p-10"
      >
        <div className="flex flex-col items-center">
          <img
            src="/images/logo.jpg"
            alt="logo"
            className="h-20 w-20 rounded-full border-4 border-gold-500 object-cover shadow-lg shadow-gold-500/30"
          />
          <h1 className="font-display mt-5 text-2xl font-bold text-white">Admin Portal</h1>
          <p className="mt-1 text-xs tracking-[0.2em] text-gold-400 uppercase">
            Jan &amp; Jimels Party Needs
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-white/70 uppercase">
              Username
            </label>
            <input
              required
              maxLength={150}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-white/70 uppercase">
              Password
            </label>
            <input
              required
              type="password"
              maxLength={128}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gold-500 py-3.5 text-sm font-bold text-navy-950 shadow-xl shadow-gold-500/25 transition hover:bg-gold-400 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-white/50">
          <Link to="/" className="transition hover:text-gold-400">
            ← Back to website
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
