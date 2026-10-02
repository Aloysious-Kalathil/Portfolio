import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import testimonials from '../data/testimonials.json'
import { gsap, SplitText, useGSAP, EASE } from '../utils/gsapSetup'
import { useReducedMotion } from '../hooks/useReducedMotion'
import ScrollFade from '../components/animations/ScrollFade'
import { pad } from '../utils/formatDate'

const clean = (quote) => quote.replace(/^PLACEHOLDER\s*[—-]\s*/i, '')

/**
 * One quote at a time, set large. Changing quotes wipes the words out upward
 * and brings the next in from below. Placeholder entries carry a visible tag.
 */
export default function Testimonials() {
  const [index, setIndex] = useState(0)
  const quoteRef = useRef(null)
  const root = useRef(null)
  const reduced = useReducedMotion()
  const busy = useRef(false)
  const current = testimonials[index]

  const { contextSafe } = useGSAP({ scope: root })

  const go = contextSafe((dir) => {
    if (busy.current || testimonials.length < 2) return
    const next = (index + dir + testimonials.length) % testimonials.length
    if (reduced) {
      setIndex(next)
      return
    }
    busy.current = true
    const split = SplitText.create(quoteRef.current, { type: 'lines', mask: 'lines', aria: 'none' })
    gsap.to(split.lines, {
      yPercent: -110,
      duration: 0.6,
      stagger: 0.04,
      ease: EASE.in,
      onComplete: () => {
        split.revert()
        gsap.set(quoteRef.current, { autoAlpha: 0 })
        // New key → React mounts a fresh blockquote, so SplitText never edits
        // nodes React still tracks
        flushSync(() => setIndex(next))
        requestAnimationFrame(() => {
          const incoming = SplitText.create(quoteRef.current, { type: 'lines', mask: 'lines', aria: 'none' })
          gsap.set(quoteRef.current, { autoAlpha: 1 })
          gsap.from(incoming.lines, {
            yPercent: 110,
            duration: 1,
            stagger: 0.06,
            ease: EASE.out,
            onComplete: () => {
              incoming.revert()
              busy.current = false
            },
          })
        })
      },
    })
  })

  if (!testimonials.length) return null

  return (
    <section ref={root} className="frame py-section" aria-labelledby="testimonials-heading" aria-roledescription="carousel">
      <div className="grid-layout gap-y-10">
        <div className="col-span-4 flex items-start justify-between md:col-span-8 lg:col-span-3 lg:flex-col lg:justify-start lg:gap-6">
          <p id="testimonials-heading" className="label">
            Kind words
          </p>
          <p className="label tabular" aria-live="polite">
            {pad(index + 1)} / {pad(testimonials.length)}
          </p>
        </div>

        <ScrollFade className="col-span-4 md:col-span-8 lg:col-span-8 lg:col-start-5">
          <figure>
            {current.placeholder && (
              <span className="mb-6 inline-block border border-accent-ink/60 px-2 py-1 font-mono text-label uppercase text-accent-ink">
                Placeholder
              </span>
            )}
            <blockquote key={index} ref={quoteRef} className="font-display text-display-sm font-bold text-pretty">
              <p>
                <span aria-hidden="true" className="text-accent-ink">
                  “
                </span>
                {clean(current.quote)}
                <span aria-hidden="true" className="text-accent-ink">
                  ”
                </span>
              </p>
            </blockquote>
            <figcaption className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6">
              <span>
                <span className="block font-medium">{current.name}</span>
                <span className="block text-sm text-muted">
                  {current.role}, {current.company}
                </span>
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous testimonial"
                  className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-fg"
                >
                  <ArrowLeftIcon className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next testimonial"
                  className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-fg"
                >
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </button>
              </span>
            </figcaption>
          </figure>
        </ScrollFade>
      </div>
    </section>
  )
}
