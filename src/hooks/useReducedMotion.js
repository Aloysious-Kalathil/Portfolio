import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'
const mql = typeof window !== 'undefined' ? window.matchMedia(QUERY) : null

export const prefersReducedMotion = () => Boolean(mql?.matches)

const subscribe = (callback) => {
  mql?.addEventListener('change', callback)
  return () => mql?.removeEventListener('change', callback)
}

/** True when the visitor asked the OS for reduced motion. Live-updating. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}

export default useReducedMotion
