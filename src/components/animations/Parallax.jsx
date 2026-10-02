import { useRef } from 'react'
import { gsap, useGSAP } from '../../utils/gsapSetup'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/**
 * Scroll-scrubbed parallax. The outer element is the (static) trigger, the
 * inner layer moves — so layout never jitters. Stack several with different
 * `speed`s for layered depth.
 *
 *  speed   — travel as a fraction of the element's height across the whole
 *            pass through the viewport. Positive moves slower than the page
 *            (drifts down), negative moves faster (drifts up).
 *  media   — set when the child is an image filling a masked frame: the inner
 *            layer is oversized by the travel distance so no edge ever shows.
 */
export default function Parallax({
  as: Tag = 'div',
  speed = 0.15,
  media = false,
  className = '',
  innerClassName = '',
  children,
  ...rest
}) {
  const outer = useRef(null)
  const inner = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced) return
      const travel = speed * 100
      gsap.fromTo(
        inner.current,
        { yPercent: -travel / 2 },
        {
          yPercent: travel / 2,
          ease: 'none',
          scrollTrigger: {
            trigger: outer.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    },
    { scope: outer, dependencies: [reduced, speed], revertOnUpdate: true },
  )

  const bleed = media && !reduced ? `${Math.abs(speed) * 50}%` : 0

  return (
    <Tag ref={outer} className={`${media ? 'relative overflow-hidden' : ''} ${className}`} {...rest}>
      <div
        ref={inner}
        className={`${media ? 'absolute inset-x-0' : ''} will-change-transform ${innerClassName}`}
        style={media ? { top: `-${bleed}`, bottom: `-${bleed}` } : undefined}
      >
        {children}
      </div>
    </Tag>
  )
}
