import { useRef } from 'react'
import { gsap, SplitText, useGSAP, EASE, REVEAL_START } from '../../utils/gsapSetup'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { whenPageVisible } from '../../hooks/useSiteReady'

/**
 * Heading that reveals line by line from behind a mask.
 * - trigger="scroll": plays when it enters the viewport
 * - trigger="load":   plays as soon as the page is visible (hero headings)
 * type="lines" (default), "words" or "chars" — the smallest unit animates.
 * Screen readers get the intact text (SplitText sets aria-label).
 */
export default function SplitTextReveal({
  as: Tag = 'h2',
  children,
  className = '',
  trigger = 'scroll',
  delay = 0,
  stagger = 0.085,
  duration = 1.15,
  start = REVEAL_START,
  type = 'lines',
  ...rest
}) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(
    (context, contextSafe) => {
      const el = ref.current
      let alive = true
      gsap.set(el, { autoAlpha: 0 })

      const run = contextSafe(() => {
        if (!alive) return
        const scrollTrigger = trigger === 'scroll' ? { trigger: el, start, once: true } : undefined

        if (reduced) {
          gsap.to(el, { autoAlpha: 1, duration: 0.6, ease: 'power1.out', delay, scrollTrigger })
          return
        }

        // Animate the smallest unit requested, each inside its own mask
        const unit = type.includes('chars') ? 'chars' : type.includes('words') ? 'words' : 'lines'
        SplitText.create(el, {
          type,
          mask: unit,
          // Lines and words keep their text intact for screen readers; the
          // one chars split (hero name) sits inside an aria-hidden wrapper
          // with an sr-only copy. aria-label on a <p>/<span> is invalid.
          aria: 'none',
          linesClass: 'split-line',
          autoSplit: true,
          onSplit(self) {
            gsap.set(el, { autoAlpha: 1 })
            self.masks?.forEach((m) => m.classList.add('split-line-mask'))
            const targets = self[unit]
            return gsap.from(targets, {
              yPercent: 115,
              rotate: 2.5,
              transformOrigin: '0% 100%',
              duration,
              stagger,
              delay,
              ease: EASE.out,
              scrollTrigger,
            })
          },
        })
      })

      Promise.all([whenPageVisible(), document.fonts?.ready]).then(run)
      return () => {
        alive = false
      }
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  )

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  )
}
