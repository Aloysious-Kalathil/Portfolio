import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { gsap, EASE } from '../../utils/gsapSetup'
import { useScrollLock } from '../../hooks/useLenis'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/**
 * Accessible modal (Headless UI Dialog: focus trap, Esc to close, focus
 * return) with GSAP enter/exit. Page scroll (Lenis) is paused while open.
 */
export default function Modal({ open, onClose, title, hideTitle = false, children, className = '' }) {
  const [mounted, setMounted] = useState(open)
  const backdrop = useRef(null)
  const panel = useRef(null)
  const reduced = useReducedMotion()

  useScrollLock(mounted)

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  // Enter
  useEffect(() => {
    if (!mounted || !open || !panel.current) return
    const d = reduced ? 0.01 : 1
    const ctx = gsap.context(() => {
      gsap.fromTo(backdrop.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 * d, ease: 'power2.out' })
      gsap.fromTo(
        panel.current,
        { autoAlpha: 0, y: reduced ? 0 : 40, clipPath: reduced ? 'none' : 'inset(8% 4% 8% 4%)' },
        { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 * d || 0.3, ease: EASE.out },
      )
    })
    return () => ctx.revert()
  }, [mounted, open, reduced])

  // Exit, then unmount
  useEffect(() => {
    if (open || !mounted) return
    const tl = gsap.timeline({ onComplete: () => setMounted(false) })
    tl.to(panel.current, { autoAlpha: 0, y: reduced ? 0 : 24, duration: reduced ? 0.2 : 0.45, ease: EASE.in })
    tl.to(backdrop.current, { autoAlpha: 0, duration: 0.3 }, '<0.1')
    return () => tl.kill()
  }, [open, mounted, reduced])

  return (
    <Dialog open={mounted} onClose={onClose} className="relative z-modal">
      <div ref={backdrop} className="fixed inset-0 bg-bg/95" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-margin" data-lenis-prevent>
        <DialogPanel ref={panel} className={`relative max-h-full w-full overflow-auto bg-bg ${className}`}>
          <div className="flex items-center justify-between gap-6 pb-4">
            <DialogTitle className={hideTitle ? 'sr-only' : 'label'}>{title}</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="group -mr-2 inline-flex items-center gap-2 p-2 font-mono text-label uppercase text-muted transition-colors hover:text-fg"
            >
              Close
              <XMarkIcon className="size-5 transition-transform duration-600 ease-out-expo group-hover:rotate-90" aria-hidden="true" />
            </button>
          </div>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
