import { useEffect, useRef, useState } from 'react'
import { getLenis, useLenis } from './useLenis'

/**
 * Low-level scroll subscription. Calls `onScroll({ y, velocity, direction,
 * progress })` every scroll frame WITHOUT re-rendering. Works with or without
 * Lenis (falls back to window scroll + a computed velocity).
 */
export function useScroll(onScroll) {
  const lenis = useLenis()
  const callbackRef = useRef(onScroll)
  callbackRef.current = onScroll

  useEffect(() => {
    if (lenis) {
      const handler = (l) =>
        callbackRef.current?.({
          y: l.scroll,
          velocity: l.velocity,
          direction: l.direction,
          progress: l.progress,
        })
      lenis.on('scroll', handler)
      return () => lenis.off('scroll', handler)
    }

    let lastY = window.scrollY
    let lastT = performance.now()
    const handler = () => {
      const y = window.scrollY
      const now = performance.now()
      const dt = Math.max(now - lastT, 1)
      const max = document.documentElement.scrollHeight - window.innerHeight
      callbackRef.current?.({
        y,
        velocity: ((y - lastY) / dt) * 16, // ≈ px per frame, like Lenis
        direction: y > lastY ? 1 : y < lastY ? -1 : 0,
        progress: max > 0 ? y / max : 0,
      })
      lastY = y
      lastT = now
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [lenis])
}

/**
 * Coarse scroll state for UI that should only re-render on changes:
 * - hidden: scrolling down past `hideAfter` px (header slides away)
 * - past: scrolled beyond `threshold` px (header gets its background)
 */
export function useScrollState({ threshold = 0, hideAfter = 120 } = {}) {
  const [state, setState] = useState({ hidden: false, past: false })
  const stateRef = useRef(state)

  useScroll(({ y, direction }) => {
    const past = y > threshold
    let hidden = stateRef.current.hidden
    if (y < hideAfter) hidden = false
    else if (direction === 1) hidden = true
    else if (direction === -1) hidden = false
    if (hidden !== stateRef.current.hidden || past !== stateRef.current.past) {
      stateRef.current = { hidden, past }
      setState(stateRef.current)
    }
  })

  // Reset when the page changes (scroll jumps to 0 without a direction)
  useEffect(() => {
    const y = getLenis()?.scroll ?? window.scrollY
    if (y === 0 && (stateRef.current.hidden || stateRef.current.past)) {
      stateRef.current = { hidden: false, past: false }
      setState(stateRef.current)
    }
  })

  return state
}

/**
 * Marks <html data-chrome={tone}> while the element sits under the fixed
 * navigation, so the pills and wordmark can switch to a readable colour pair.
 */
export function useChromeTone(ref, tone = 'on-accent') {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const root = document.documentElement
    const PROBE_Y = 60 // roughly the middle of the pill stack
    let active = false
    const check = () => {
      const rect = el.getBoundingClientRect()
      const next = rect.top <= PROBE_Y && rect.bottom >= PROBE_Y
      if (next === active) return
      active = next
      if (active) root.dataset.chrome = tone
      else if (root.dataset.chrome === tone) delete root.dataset.chrome
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      if (active && root.dataset.chrome === tone) delete root.dataset.chrome
    }
  }, [ref, tone])
}

/** Current scroll velocity (px/frame), for effects that poll each tick. */
export function getScrollVelocity() {
  return getLenis()?.velocity ?? 0
}

export default useScroll
