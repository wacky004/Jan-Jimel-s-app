import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api, { clearTokens, setTokens } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('jj_access')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me/')
      .then(({ data }) => setUser(data))
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password })
    setTokens(data.access, data.refresh)
    const { data: me } = await api.get('/auth/me/')
    setUser(me)
    return me
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
