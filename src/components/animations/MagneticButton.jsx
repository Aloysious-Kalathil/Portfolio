import { useRef } from 'react'
import { gsap, useGSAP } from '../../utils/gsapSetup'
import { useFeatures } from '../../hooks/useFeatures'

/**
 * Pulls its child toward the pointer while hovered, then eases home.
 * The label (first child's children) follows a little further than the
 * shape, which reads as depth. No-op on touch / reduced motion.
 */
export default function MagneticButton({ as: Tag = 'span', strength = 0.32, className = '', children, ...rest }) {
  const ref = useRef(null)
  const { magnetic } = useFeatures()

  useGSAP(
    (context, contextSafe) => {
      if (!magnetic) return
      const el = ref.current
      const label = el.querySelector('[data-magnetic-label]')
      const cfg = { duration: 0.9, ease: 'power3.out' }
      const xTo = gsap.quickTo(el, 'x', cfg)
      const yTo = gsap.quickTo(el, 'y', cfg)
      const lxTo = label && gsap.quickTo(label, 'x', cfg)
      const lyTo = label && gsap.quickTo(label, 'y', cfg)

      const move = contextSafe((e) => {
        const rect = el.getBoundingClientRect()
        // Remove the element's own offset so the pull doesn't feed back on itself
        const cx = rect.left + rect.width / 2 - gsap.getProperty(el, 'x')
        const cy = rect.top + rect.height / 2 - gsap.getProperty(el, 'y')
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        xTo(dx * strength)
        yTo(dy * strength)
        lxTo?.(dx * strength * 0.45)
        lyTo?.(dy * strength * 0.45)
      })
      const leave = contextSafe(() => {
        xTo(0)
        yTo(0)
        lxTo?.(0)
        lyTo?.(0)
      })

      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      return () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      }
    },
    { scope: ref, dependencies: [magnetic, strength], revertOnUpdate: true },
  )

  return (
    <Tag ref={ref} className={`inline-block will-change-transform ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
