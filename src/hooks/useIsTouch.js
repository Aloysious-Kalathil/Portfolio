import { useSyncExternalStore } from 'react'

// "Touch" here means: the primary pointer can't hover precisely. A laptop with
// a touchscreen still gets the custom cursor; a phone or tablet does not.
const QUERY = '(hover: none), (pointer: coarse)'
const mql = typeof window !== 'undefined' ? window.matchMedia(QUERY) : null

export const isTouchDevice = () => Boolean(mql?.matches)

const subscribe = (callback) => {
  mql?.addEventListener('change', callback)
  return () => mql?.removeEventListener('change', callback)
}

export function useIsTouch() {
  return useSyncExternalStore(subscribe, isTouchDevice, () => false)
}

export default useIsTouch
