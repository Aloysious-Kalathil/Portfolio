import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, REVEAL_START } from '../../utils/gsapSetup'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { whenPageVisible } from '../../hooks/useSiteReady'

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const randomGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]

/** `text` with everything after `progress` (0–1) replaced by random glyphs. */
export function scramble(text, progress) {
  const settled = Math.floor(text.length * progress)
  let out = ''
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    out += i < settled || !/[\p{L}\p{N}]/u.test(ch) ? ch : randomGlyph()
  }
  return out
}

/**
 * Text that resolves out of random letters, left to right.
 *  trigger="load"   — plays once the page is visible (default)
 *  trigger="scroll" — plays when it enters the viewport
 *  trigger="none"   — only on hover
 *  hover            — replays when the nearest link/button (or itself) is hovered
 * Screen readers get the plain text; the animated copy is aria-hidden.
 */
export default function ScrambleText({
  as: Tag = 'span',
  children,
  trigger = 'load',
  hover = false,
  delay = 0,
  duration = 0.9,
  className = '',
  ...rest
}) {
  const root = useRef(null)
  const live = useRef(null)
  const reduced = useReducedMotion()
  const text = String(children)

  useGSAP(
    (context, contextSafe) => {
      const el = live.current
      let alive = true
      const state = { p: 0 }

      const play = contextSafe((wait = 0) => {
        gsap.killTweensOf(state)
        state.p = 0
        gsap.set(el, { autoAlpha: 1 })
        gsap.to(state, {
          p: 1,
          duration,
          delay: wait,
          ease: 'none',
          onUpdate: () => (el.textContent = scramble(text, state.p)),
          onComplete: () => (el.textContent = text),
        })
      })

      if (reduced) return undefined

      if (trigger !== 'none') {
        gsap.set(el, { autoAlpha: 0 })
        const arm = contextSafe(() => {
          if (!alive) return
          if (trigger === 'scroll') {
            ScrollTrigger.create({ trigger: root.current, start: REVEAL_START, once: true, onEnter: () => play(delay) })
          } else play(delay)
        })
        whenPageVisible().then(arm)
      }

      const target = hover ? root.current.closest('a, button') || root.current : null
      const replay = () => play(0)
      target?.addEventListener('pointerenter', replay)
      return () => {
        alive = false
        target?.removeEventListener('pointerenter', replay)
        el.textContent = text
      }
    },
    { scope: root, dependencies: [reduced, text, trigger, hover], revertOnUpdate: true },
  )

  return (
    <Tag ref={root} className={className} {...rest}>
      <span className="sr-only">{text}</span>
      <span ref={live} aria-hidden="true">
        {text}
      </span>
    </Tag>
  )
}
