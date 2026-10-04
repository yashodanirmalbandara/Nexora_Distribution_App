import { useCallback, useEffect, useState } from 'react'
import MainInterface from './MainInterface'
import DispatcherApp from './DispatcherApp'
import LoaderApp from './LoaderApp'
import DriverApp from './DriverApp'
import StoreApp from './StoreApp'
import { ROLE_IDS, type Role } from './types'

const THEME_KEY = 'waypoint-theme'

function readRole(): Role | null {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return (ROLE_IDS as string[]).includes(hash) ? (hash as Role) : null
}

function readTheme(): boolean {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved) return saved === 'dark'
  } catch { /* storage unavailable */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export default function App() {
  const [role, setRole] = useState<Role | null>(readRole)
  const [isDark, setIsDark] = useState<boolean>(readTheme)

  // Keep the URL hash (#/dispatcher, #/driver …) and the visible interface in sync,
  // so every interface is deep-linkable and the browser back button works.
  useEffect(() => {
    const onHash = () => { setRole(readRole()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light') } catch { /* ignore */ }
  }, [isDark])

  const home = useCallback(() => { window.location.hash = '' }, [])
  const toggleDark = useCallback(() => setIsDark(d => !d), [])

  const shared = { isDark, onToggleDark: toggleDark, onSwitchView: home }

  switch (role) {
    case 'dispatcher':   return <DispatcherApp {...shared} />
    case 'loader':       return <LoaderApp {...shared} />
    case 'driver':       return <DriverApp {...shared} />
    case 'store':        return <StoreApp {...shared} />
    default:             return <MainInterface />
  }
}
