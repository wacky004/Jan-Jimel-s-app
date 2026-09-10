import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteFocus() {
  const { pathname } = useLocation()
  useEffect(() => {
    const focusMain = () => {
      const main = document.getElementById('main-content')
      if (!main || !main.getClientRects().length || main.closest('[aria-busy="true"]')) return false
      main.focus({ preventScroll: true })
      return true
    }
    if (focusMain()) return
    // Auth guards and lazy route chunks can mount the destination after navigation.
    const observer = new MutationObserver(() => { if (focusMain()) observer.disconnect() })
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden', 'aria-busy'] })
    return () => observer.disconnect()
  }, [pathname])
  return null
}
