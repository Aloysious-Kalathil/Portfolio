import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../../utils/gsapSetup'
import { liveColorCss } from '../../utils/liveColor'

/**
 * Custom cursor: a small dot plus a thin ring that trails it, both in the
 * live colour (utils/liveColor.js), which drifts as you move and scroll.
 * States come from the element under the pointer:
 *   a, button, [data-cursor="link"]      → ring widens and tints, dot hides
 *   [data-cursor="view" | "drag"]        → small filled disc with a label
 *                                          (text from data-cursor-label)
 *   [data-cursor="text"]                 → ring narrows into a text caret
 *   input, textarea, [data-cursor="none"] → cursor steps aside
 * Only mounted on fine pointers without reduced motion (see useFeatures).
 */
const SIZES = {
  default: [22, 22],
  link: [40, 40],
  label: [68, 68],
  text: [3, 30],
  none: [0, 0],
}

function resolve(target) {
  const el = target instanceof Element ? target : null
  if (!el) return { type: 'default' }
  // Over a full-accent section the live colour could vanish into the
  // background, so the cursor takes the section's own text colour there
  const onAccent = Boolean(el.closest('[data-tone="accent"]'))
  const state = resolveType(el)
  return onAccent ? { ...state, onAccent } : state
}

function resolveType(el) {
  if (el.closest('input, textarea, select, [data-cursor="none"]')) return { type: 'none' }
  const tagged = el.closest('[data-cursor]')
  if (tagged) {
    const kind = tagged.dataset.cursor
    if (kind === 'view' || kind === 'drag') {
      return { type: 'label', label: tagged.dataset.cursorLabel || (kind === 'drag' ? 'Drag' : 'View') }
    }
    if (kind === 'text') return { type: 'text' }
    if (kind === 'link') return { type: 'link' }
  }
  if (el.closest('a, button, [role="button"], label, summary')) return { type: 'link' }
  return { type: 'default' }
}

export default function Cursor() {
  const root = useRef(null)
  const dot = useRef(null)
  const ring = useRef(null)
  const [state, setState] = useState({ type: 'default', label: '' })
  const stateRef = useRef(state)

  useGSAP(
    (context, contextSafe) => {
      const d = dot.current
      const r = ring.current
      gsap.set([d, r], { xPercent: -50, yPercent: -50, autoAlpha: 0 })

      const dx = gsap.quickTo(d, 'x', { duration: 0.1, ease: 'power3.out' })
      const dy = gsap.quickTo(d, 'y', { duration: 0.1, ease: 'power3.out' })
      const rx = gsap.quickTo(r, 'x', { duration: 0.35, ease: 'power3.out' })
      const ry = gsap.quickTo(r, 'y', { duration: 0.35, ease: 'power3.out' })
      let visible = false
      let lastTarget = null
      const last = { x: -1, y: -1 }
      const timers = []

      const apply = contextSafe((next) => {
        const prev = stateRef.current
        if (prev.type === next.type && prev.label === next.label && Boolean(prev.onAccent) === Boolean(next.onAccent)) return
        stateRef.current = { label: '', ...next }
        setState(stateRef.current)
        const [width, height] = SIZES[next.type]
        gsap.to(r, { width, height, duration: 0.5, ease: 'expo.out', overwrite: 'auto' })
        gsap.to(d, { scale: next.type === 'default' ? 1 : 0, duration: 0.3, ease: 'power3.out', overwrite: 'auto' })
      })

      // Colour follows the live hue every frame (it also moves with scroll)
      let painted = ''
      const paint = () => {
        if (!visible) return
        const color = stateRef.current.onAccent ? 'rgb(var(--accent-contrast))' : liveColorCss()
        if (color === painted) return
        painted = color
        d.style.setProperty('--c', color)
        r.style.setProperty('--c', color)
      }
      gsap.ticker.add(paint)

      const onMove = contextSafe((e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return
        if (!visible) {
          gsap.set([d, r], { x: e.clientX, y: e.clientY })
          gsap.to([d, r], { autoAlpha: 1, duration: 0.3 })
          visible = true
        }
        last.x = e.clientX
        last.y = e.clientY
        dx(e.clientX)
        dy(e.clientY)
        rx(e.clientX)
        ry(e.clientY)
        if (e.target !== lastTarget) {
          lastTarget = e.target
          apply(resolve(e.target))
        }
      })
      const onLeave = contextSafe(() => {
        visible = false
        gsap.to([d, r], { autoAlpha: 0, duration: 0.3 })
      })
      const onDown = contextSafe(() => gsap.to(r, { scale: 0.75, duration: 0.25, ease: 'power3.out' }))
      const onUp = contextSafe(() => gsap.to(r, { scale: 1, duration: 0.5, ease: 'expo.out' }))
      // Content can change under a still pointer (route change, menu open):
      // look again at what's under it once things have settled
      const recheck = contextSafe(() => {
        if (last.x < 0) return
        lastTarget = document.elementFromPoint(last.x, last.y)
        apply(resolve(lastTarget))
      })
      const onRecheck = () => {
        timers.forEach(clearTimeout)
        timers.length = 0
        timers.push(setTimeout(recheck, 80), setTimeout(recheck, 1400), setTimeout(recheck, 3000))
      }

      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
      window.addEventListener('pointerdown', onDown)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('popstate', onRecheck)
      window.addEventListener('click', onRecheck)
      return () => {
        timers.forEach(clearTimeout)
        gsap.ticker.remove(paint)
        window.removeEventListener('pointermove', onMove)
        document.documentElement.removeEventListener('pointerleave', onLeave)
        window.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('popstate', onRecheck)
        window.removeEventListener('click', onRecheck)
      }
    },
    { scope: root },
  )

  const { type, label } = state
  const labelled = type === 'label'

  return (
    <div ref={root} aria-hidden="true" className="contents">
      <div
        ref={ring}
        style={{ width: SIZES.default[0], height: SIZES.default[1] }}
        className={`pointer-events-none fixed left-0 top-0 z-cursor flex items-center justify-center rounded-full transition-[background-color,border-color,border-width] duration-400 ${
          labelled || type === 'text'
            ? 'border-0 bg-[var(--c)]'
            : type === 'link'
              ? 'border-[1.5px] border-[var(--c)] bg-[color-mix(in_srgb,var(--c)_18%,transparent)]'
              : 'border-[1.5px] border-[var(--c)] bg-transparent'
        }`}
      >
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.08em] text-bg transition-opacity duration-400 ${
            labelled ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {label}
        </span>
      </div>
      <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-cursor size-[6px] rounded-full bg-[var(--c)]" />
    </div>
  )
}
