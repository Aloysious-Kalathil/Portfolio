import { useEffect, useSyncExternalStore } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../utils/gsapSetup'

/**
 * Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger and Lenis read
 * the same frame. There is exactly one instance, kept in this module.
 */
let lenis = null
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())
const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const getLenis = () => lenis

/** Returns the Lenis instance, or null when smooth scroll is off. */
export function useLenis() {
  return useSyncExternalStore(subscribe, getLenis, () => null)
}

/** Mount once near the root. Creates/destroys Lenis as `enabled` changes. */
export function useSmoothScroll(enabled) {
  useEffect(() => {
    if (!enabled) return undefined

    const instance = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false, // touch keeps native momentum
      anchors: true,
    })
    const tick = (time) => instance.raf(time * 1000)

    instance.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    lenis = instance
    emit()

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      instance.destroy()
      lenis = null
      emit()
    }
  }, [enabled])
}

/** Freeze page scroll while an overlay (menu, modal) is open. Nested locks
 *  are counted so closing one overlay doesn't release another's lock. */
let lockCount = 0
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined
    lockCount += 1
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        document.documentElement.style.overflow = ''
        lenis?.start()
      }
    }
  }, [locked])
}

export function scrollToTop({ immediate = true } = {}) {
  if (lenis) lenis.scrollTo(0, { immediate, force: true })
  else window.scrollTo({ top: 0, behavior: immediate ? 'instant' : 'smooth' })
}

export function scrollToElement(target, options = {}) {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4, ...options })
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    el?.scrollIntoView({ behavior: 'smooth' })
  }
}

export default useLenis
