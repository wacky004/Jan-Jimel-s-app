import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

const TOKEN_KEY = 'jj_access'
const REFRESH_KEY = 'jj_refresh'

export function setTokens(access, refresh) {
  localStorage.setItem(TOKEN_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function getAccess() {
  return localStorage.getItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem(REFRESH_KEY)
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/login/refresh/', { refresh })
          setTokens(data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          clearTokens()
          window.location.href = '/admin/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
