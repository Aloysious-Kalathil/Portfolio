import { useSyncExternalStore } from 'react'

/**
 * Two gates that intro animations wait on:
 *  - siteReady: the preloader has finished (or was skipped)
 *  - transitioning: a page transition overlay is covering the screen
 * `whenPageVisible()` resolves once the current page can actually be seen,
 * so above-the-fold reveals don't play behind an overlay.
 */
let ready = false
let transitioning = false
const listeners = new Set()
let waiters = []

const visible = () => ready && !transitioning

function notify() {
  listeners.forEach((fn) => fn())
  if (visible() && waiters.length) {
    const pending = waiters
    waiters = []
    pending.forEach((resolve) => resolve())
  }
}

export function markSiteReady() {
  if (ready) return
  ready = true
  notify()
}

export function beginPageTransition() {
  transitioning = true
  notify()
}

export function endPageTransition() {
  if (!transitioning) return
  transitioning = false
  notify()
}

export const isSiteReady = () => ready
export const isPageVisible = visible

export function whenPageVisible() {
  if (visible()) return Promise.resolve()
  return new Promise((resolve) => waiters.push(resolve))
}

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useSiteReady() {
  return useSyncExternalStore(subscribe, isSiteReady, () => false)
}

export function usePageVisible() {
  return useSyncExternalStore(subscribe, visible, () => false)
}

export default useSiteReady
