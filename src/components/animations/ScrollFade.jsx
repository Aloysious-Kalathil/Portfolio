import { useRef } from 'react'
import { gsap, useGSAP, EASE, REVEAL_START } from '../../utils/gsapSetup'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { whenPageVisible } from '../../hooks/useSiteReady'

/**
 * Scroll-triggered entrance.
 *  variant="up"   — fade + rise (default)
 *  variant="fade" — opacity only
 *  variant="clip" — image wipe: the frame un-clips bottom→top while the media
 *                   inside settles from a slight zoom (scale 1.25 → 1)
 * `stagger` animates the direct children in sequence instead of the wrapper.
 * With reduced motion every variant becomes a short opacity fade.
 */
export default function ScrollFade({
  as: Tag = 'div',
  variant = 'up',
  stagger = 0,
  delay = 0,
  distance = 48,
  start = REVEAL_START,
  trigger = 'scroll',
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(
    (context, contextSafe) => {
      const el = ref.current
      let alive = true
      const targets = stagger ? Array.from(el.children) : [el]
      const media = variant === 'clip' ? el.querySelectorAll('img, video, canvas, [data-reveal-media]') : []

      // Hidden state is applied immediately so nothing flashes before the reveal
      if (reduced) gsap.set(targets, { autoAlpha: 0 })
      else if (variant === 'clip') {
        gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' })
        gsap.set(media, { scale: 1.25 })
      } else gsap.set(targets, { autoAlpha: 0, y: variant === 'up' ? distance : 0 })

      const run = contextSafe(() => {
        if (!alive) return
        const scrollTrigger = trigger === 'scroll' ? { trigger: el, start, once: true } : undefined

        if (reduced) {
          gsap.to(targets, { autoAlpha: 1, duration: 0.6, ease: 'power1.out', stagger: stagger * 0.5, delay, scrollTrigger })
          return
        }
        if (variant === 'clip') {
          const tl = gsap.timeline({ delay, scrollTrigger })
          tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: EASE.inOut })
          tl.to(media, { scale: 1, duration: 1.9, ease: EASE.out }, 0)
          return
        }
        gsap.to(targets, {
          autoAlpha: 1,
          y: 0,
          duration: 1.1,
          ease: EASE.out,
          stagger,
          delay,
          scrollTrigger,
          clearProps: 'transform',
        })
      })

      whenPageVisible().then(run)
      return () => {
        alive = false
      }
    },
    { scope: ref, dependencies: [reduced, variant], revertOnUpdate: true },
  )

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  )
}
