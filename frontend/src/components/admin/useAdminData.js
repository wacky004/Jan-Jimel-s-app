import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../api'

// Keep the existing URLs and response shape; ignore superseded filter requests.
export default function useAdminData(url, delay = 0) {
  const [result, setResult] = useState({ url: null, data: null, loading: true, error: false })
  const request = useRef(0)
  const load = useCallback(async () => {
    const current = ++request.current
    setResult((previous) => ({ ...previous, url, loading: true, error: false }))
    try {
      const { data } = await api.get(url)
      if (current === request.current) setResult({ url, data: data.results || data, loading: false, error: false })
    } catch {
      if (current === request.current) setResult((previous) => ({ ...previous, url, loading: false, error: true }))
    }
  }, [url])
  const invalidate = useCallback(() => { request.current++ }, [])
  useEffect(() => {
    const timer = setTimeout(load, delay)
    return () => { clearTimeout(timer); invalidate() }
  }, [load, delay, invalidate])
  return { data: result.data, loading: result.loading || result.url !== url, error: result.url === url && result.error, load }
}
