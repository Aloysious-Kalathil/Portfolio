import { useCallback, useSyncExternalStore } from 'react'

/**
 * Theme store. The initial value is applied before first paint by the inline
 * script in index.html (no flash); this module keeps it in sync afterwards.
 * Saved choice (localStorage) > siteConfig.settings.defaultTheme > OS setting.
 */
const STORAGE_KEY = 'theme'
const listeners = new Set()
const root = typeof document !== 'undefined' ? document.documentElement : null
const systemQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: light)') : null

const read = () => (root?.dataset.theme === 'light' ? 'light' : 'dark')

function readSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function apply(theme, persist) {
  if (!root) return
  root.dataset.theme = theme
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Private mode: theme still applies for this page view
    }
  }
  listeners.forEach((fn) => fn())
}

// Follow the OS only while the visitor hasn't picked a theme and the site
// default is 'system' (flag written by the inline script).
systemQuery?.addEventListener('change', (event) => {
  if (!readSaved() && root?.dataset.themeSource === 'system') apply(event.matches ? 'light' : 'dark', false)
})

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'dark')
  const setTheme = useCallback((next) => apply(next, true), [])
  const toggleTheme = useCallback(() => apply(read() === 'dark' ? 'light' : 'dark', true), [])
  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' }
}

export default useTheme
